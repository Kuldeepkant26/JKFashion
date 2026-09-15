import type { FilterQuery, Types } from "mongoose";
import {
  ProductionOrder,
  ORDER_STATUS,
  OPEN_ORDER_STATUSES,
  type IProductionOrder,
  type OrderStatus,
} from "../models/productionOrder.model.js";
import { Company } from "../models/company.model.js";
import { uploadImage, destroyImage } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { startOfDayUTC, endOfDayUTC } from "../utils/productionDate.js";

/** Where Cloudinary keeps design images, under the configured base folder. */
const IMAGE_FOLDER = "inventory";

/**
 * Is this order late?
 *
 * Derived rather than stored: being overdue is a fact about the deadline and
 * today, not a state anyone chooses. A stored flag would need a nightly job to
 * stay true and would go stale the moment a deadline moved.
 */
const isOverdue = (order: { deadline?: Date | null; status: OrderStatus }): boolean =>
  Boolean(
    order.deadline &&
      order.status !== ORDER_STATUS.COMPLETED &&
      new Date(order.deadline).getTime() < startOfDayUTC().getTime()
  );

/** The shape the API returns: the document plus what the UI derives from it. */
export type OrderView = Record<string, unknown> & { isOverdue: boolean };

const toView = (order: IProductionOrder | Record<string, unknown>): OrderView => {
  const plain = (
    typeof (order as IProductionOrder).toObject === "function"
      ? (order as IProductionOrder).toObject()
      : order
  ) as Record<string, unknown> & { deadline?: Date; status: OrderStatus };

  return { ...plain, isOverdue: isOverdue(plain) };
};

/**
 * The filter that expresses "overdue" in a query.
 *
 * Kept here so the list, the counts and the dashboard all mean the same thing
 * by it — three copies of this condition drifting apart is how a dashboard
 * starts contradicting the list beneath it.
 */
const overdueFilter = (): FilterQuery<IProductionOrder> => ({
  deadline: { $ne: null, $lt: startOfDayUTC() },
  status: { $in: OPEN_ORDER_STATUSES },
});

export interface ListOptions {
  status?: OrderStatus | "OVERDUE";
  companyId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListResult {
  items: OrderView[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  statusCounts: Record<string, number>;
}

/**
 * Paginated, newest first.
 *
 * The log is excluded from the list: a page of twenty orders does not need
 * every entry each of them has ever accrued, and fetching them would grow the
 * response without bound. Only the detail view returns it.
 */
export const listOrders = async ({
  status,
  companyId,
  search,
  page = 1,
  limit = 20,
}: ListOptions = {}): Promise<ListResult> => {
  const filter: FilterQuery<IProductionOrder> = {};

  if (status === "OVERDUE") Object.assign(filter, overdueFilter());
  else if (status) filter.status = status;

  if (companyId) filter.company = companyId as unknown as Types.ObjectId;

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { orderNumber: rx },
      { designNumber: rx },
      { companyName: rx },
      { machine: rx },
      { operator: rx },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total, byStatus, overdue] = await Promise.all([
    ProductionOrder.find(filter)
      .select("-log")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IProductionOrder[]>()
      .exec(),
    ProductionOrder.countDocuments(filter).exec(),
    /*
     * The pill counts are of the WHOLE collection, not the current page or
     * filter — a badge that changed when you clicked it would be useless.
     */
    ProductionOrder.aggregate<{ _id: OrderStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
    ProductionOrder.countDocuments(overdueFilter()).exec(),
  ]);

  const statusCounts: Record<string, number> = { OVERDUE: overdue };
  for (const row of byStatus) statusCounts[row._id] = row.count;

  return {
    items: items.map(toView),
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    statusCounts,
  };
};

/** One order, with its full log newest first. */
export const getOrder = async (id: string): Promise<OrderView> => {
  const order = await ProductionOrder.findById(id).exec();
  if (!order) throw new ApiError(404, "That order no longer exists");

  const view = toView(order);
  const log = [...((view.log as unknown[]) ?? [])] as Array<{ date: Date }>;
  log.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { ...view, log };
};

export interface OrderInput {
  companyId: string;
  orderNumber: string;
  designNumber: string;
  status?: OrderStatus;
  orderedMetres: number;
  fabricType?: string;
  fabricWidth?: string;
  yarnType?: string;
  yarnColor?: string;
  startDate?: string;
  deadline?: string;
  estCompletion?: string;
  machine?: string;
  operator?: string;
  mendings?: number;
  rejectedMetres?: number;
  remarks?: string;
}

export const createOrder = async (
  input: OrderInput,
  createdBy: Types.ObjectId,
  image?: { buffer: Buffer; filename: string }
): Promise<OrderView> => {
  /*
   * The company is looked up rather than trusted: `companyName` is a snapshot
   * the list renders directly, so it must come from the record, never from
   * whatever the client happened to send.
   */
  const company = await Company.findById(input.companyId).exec();
  if (!company) throw new ApiError(404, "That company no longer exists");

  const uploaded = image ? await uploadImage(image.buffer, image.filename, IMAGE_FOLDER) : null;

  try {
    const order = await ProductionOrder.create({
      ...input,
      company: company._id,
      companyName: company.name,
      // Never from the client: the log is the only thing that moves this.
      completedMetres: 0,
      ...(uploaded ? { designImage: uploaded } : {}),
      createdBy,
      updatedBy: createdBy,
    });

    return toView(order);
  } catch (error) {
    // The file is already on Cloudinary but the row failed — remove it rather
    // than leaving an asset nothing points at.
    if (uploaded) await destroyImage(uploaded.publicId);
    throw error;
  }
};

export type OrderPatch = Partial<Omit<OrderInput, "companyId">> & { companyId?: string };

/**
 * Save an order's fields.
 *
 * `completedMetres` is deliberately absent from what a caller may set — it is
 * derived from the log, and letting it be typed here is exactly the drift this
 * design exists to prevent.
 */
export const updateOrder = async (
  id: string,
  patch: OrderPatch,
  updatedBy: Types.ObjectId
): Promise<OrderView> => {
  const order = await ProductionOrder.findById(id).exec();
  if (!order) throw new ApiError(404, "That order no longer exists");

  // Moving an order to another buyer re-snapshots the name with it.
  if (patch.companyId && String(patch.companyId) !== String(order.company)) {
    const company = await Company.findById(patch.companyId).exec();
    if (!company) throw new ApiError(404, "That company no longer exists");
    order.company = company._id as Types.ObjectId;
    order.companyName = company.name;
  }

  const { companyId: _ignored, ...fields } = patch;
  Object.assign(order, fields);
  order.updatedBy = updatedBy;

  await order.save();
  return toView(order);
};

export const setStatus = async (
  id: string,
  status: OrderStatus,
  updatedBy: Types.ObjectId
): Promise<OrderView> => {
  const order = await ProductionOrder.findByIdAndUpdate(
    id,
    { $set: { status, updatedBy } },
    { new: true }
  ).exec();

  if (!order) throw new ApiError(404, "That order no longer exists");
  return toView(order);
};

/** A log this long means something has gone wrong, not that work continued. */
const MAX_LOG_ENTRIES = 2000;

export interface LogInput {
  metres: number;
  date?: string;
  note?: string;
}

/**
 * Record a day's production.
 *
 * The write is a single atomic `$push` + `$inc`, not a read-modify-write: two
 * people logging at once on the floor is the normal case, and summing in
 * application code would silently lose one of them.
 *
 * Negative metres are allowed — that is how a mistyped figure is corrected,
 * leaving the mistake and its correction both visible in the history.
 */
export const logProduction = async (
  id: string,
  input: LogInput,
  user: { _id: Types.ObjectId; name: string }
): Promise<OrderView> => {
  const order = await ProductionOrder.findById(id).select("-log").exec();
  if (!order) throw new ApiError(404, "That order no longer exists");

  const existing = await ProductionOrder.findById(id).select("log").lean().exec();
  if ((existing?.log?.length ?? 0) >= MAX_LOG_ENTRIES) {
    throw new ApiError(409, "This order has too many log entries to add another.");
  }

  const next = order.completedMetres + input.metres;

  if (next < 0) {
    throw new ApiError(422, "That correction is larger than the total produced so far.");
  }

  /*
   * A 10% overrun is normal on Schiffli; ten times the order is a typo. This
   * catches "4000" typed for "400", which is the realistic data-quality failure
   * and is otherwise invisible until someone reads the dashboard.
   */
  if (input.metres > 0 && next > order.orderedMetres * 1.1) {
    throw new ApiError(
      422,
      `That would take this order to ${Math.round(next)}m against ${Math.round(
        order.orderedMetres
      )}m ordered. Check the figure.`
    );
  }

  const entry = {
    date: startOfDayUTC(input.date),
    metres: input.metres,
    note: input.note ?? "",
    loggedBy: user._id,
    loggedByName: user.name,
    createdAt: new Date(),
  };

  // Work having started is what PENDING → RUNNING means, so the first entry
  // moves it rather than making someone remember to.
  const status =
    order.status === ORDER_STATUS.PENDING && input.metres > 0
      ? ORDER_STATUS.RUNNING
      : order.status;

  const updated = await ProductionOrder.findByIdAndUpdate(
    id,
    {
      $push: { log: entry },
      $inc: { completedMetres: input.metres },
      $set: { status, updatedBy: user._id },
    },
    { new: true }
  ).exec();

  if (!updated) throw new ApiError(404, "That order no longer exists");
  return getOrder(String(updated._id));
};

/** Owner-only: remove an entry that should never have been recorded. */
export const deleteLogEntry = async (id: string, entryId: string): Promise<OrderView> => {
  const order = await ProductionOrder.findById(id).exec();
  if (!order) throw new ApiError(404, "That order no longer exists");

  const entry = order.log.id(entryId);
  if (!entry) throw new ApiError(404, "That log entry no longer exists");

  const metres = entry.metres;
  entry.deleteOne();
  // Keep the running total honest with the history it is derived from.
  order.completedMetres = Math.max(0, order.completedMetres - metres);
  await order.save();

  return getOrder(String(order._id));
};

export const setImage = async (
  id: string,
  buffer: Buffer,
  filename: string
): Promise<OrderView> => {
  const order = await ProductionOrder.findById(id).select("-log").exec();
  if (!order) throw new ApiError(404, "That order no longer exists");

  const previous = order.designImage?.publicId;
  const uploaded = await uploadImage(buffer, filename, IMAGE_FOLDER);

  order.designImage = uploaded;
  await order.save();

  // Only after the new one is stored, and only if it really changed.
  if (previous && previous !== uploaded.publicId) await destroyImage(previous);

  return toView(order);
};

export const clearImage = async (id: string): Promise<OrderView> => {
  const order = await ProductionOrder.findById(id).select("-log").exec();
  if (!order) throw new ApiError(404, "That order no longer exists");

  const publicId = order.designImage?.publicId;
  order.designImage = {};
  await order.save();

  if (publicId) await destroyImage(publicId);
  return toView(order);
};

export const deleteOrder = async (id: string): Promise<void> => {
  const order = await ProductionOrder.findByIdAndDelete(id).exec();
  if (!order) throw new ApiError(404, "That order no longer exists");

  // After the row is gone: an orphaned file costs a little storage, an
  // orphaned row pointing at a deleted file is a broken image on the page.
  if (order.designImage?.publicId) await destroyImage(order.designImage.publicId);
};

export interface SummaryResult {
  totalOrdered: number;
  totalProduced: number;
  totalRemaining: number;
  overallPct: number;
  todayProduced: number;
  counts: Record<string, number>;
}

/** The figures behind the dashboard strip. */
export const getSummary = async (): Promise<SummaryResult> => {
  const [totals, byStatus, overdue, today, companies] = await Promise.all([
    ProductionOrder.aggregate<{ _id: null; ordered: number; produced: number }>([
      {
        $group: {
          _id: null,
          ordered: { $sum: "$orderedMetres" },
          produced: { $sum: "$completedMetres" },
        },
      },
    ]).exec(),
    ProductionOrder.aggregate<{ _id: OrderStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
    ProductionOrder.countDocuments(overdueFilter()).exec(),
    /*
     * Today's output, across every order. The date bounds are the same UTC
     * normalisation the entries were written with — see utils/productionDate.
     */
    ProductionOrder.aggregate<{ _id: null; metres: number }>([
      { $unwind: "$log" },
      { $match: { "log.date": { $gte: startOfDayUTC(), $lt: endOfDayUTC() } } },
      { $group: { _id: null, metres: { $sum: "$log.metres" } } },
    ]).exec(),
    Company.countDocuments().exec(),
  ]);

  const ordered = totals[0]?.ordered ?? 0;
  const produced = totals[0]?.produced ?? 0;

  let active = 0;
  const counts: Record<string, number> = { OVERDUE: overdue, COMPANIES: companies };
  for (const row of byStatus) {
    counts[row._id] = row.count;
    if (OPEN_ORDER_STATUSES.includes(row._id)) active += row.count;
  }
  counts.ACTIVE = active;

  return {
    totalOrdered: ordered,
    totalProduced: produced,
    totalRemaining: Math.max(0, ordered - produced),
    overallPct: ordered > 0 ? Math.min(100, (produced / ordered) * 100) : 0,
    todayProduced: today[0]?.metres ?? 0,
    counts,
  };
};
