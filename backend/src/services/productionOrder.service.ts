import { Types, type FilterQuery } from "mongoose";
import {
  ProductionOrder,
  ORDER_STATUS,
  LEGACY_ORDER_STATUS,
  OPEN_ORDER_STATUSES,
  type IProductionOrder,
  type OrderStatus,
} from "../models/productionOrder.model.js";
import { Company, type ICompany } from "../models/company.model.js";
import {
  Sample,
  SAMPLE_STATUS,
  OPEN_SAMPLE_STATUSES,
  type ISample,
} from "../models/sample.model.js";
import { sampleCounts } from "./sample.service.js";
import { orderNumbers } from "../utils/docketNumber.js";
import { uploadImage, destroyImage, copyImage } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { startOfDayUTC, endOfDayUTC } from "../utils/productionDate.js";

/** Where Cloudinary keeps design images, under the configured base folder. */
const IMAGE_FOLDER = "inventory";

/** Claim the next order number for a buyer, e.g. `Dexter-JK-00109`. Atomic. */
export const generateOrderNumber = (companyName: string): Promise<string> =>
  orderNumbers.next(companyName);

/**
 * What the next number would be, without claiming it — for the form's preview.
 *
 * Advisory only: the stored number is whatever `generateOrderNumber` issues at
 * save time, which is why the form labels this as generated on save rather than
 * presenting it as final.
 */
export const previewOrderNumber = async (companyId: string): Promise<string> => {
  const company = await Company.findById(companyId).select("name").lean<ICompany>().exec();
  if (!company) throw new ApiError(404, "That company no longer exists");

  return orderNumbers.peek(company.name);
};

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
  sampleId?: string;
  search?: string;
  /** Inclusive bounds on when the order was RAISED, not on its deadline. */
  from?: string;
  to?: string;
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
  sampleId,
  search,
  from,
  to,
  page = 1,
  limit = 20,
}: ListOptions = {}): Promise<ListResult> => {
  /*
   * `scope` is what the pill counts are taken over: the whole collection on
   * the Production tab, one buyer inside that buyer's dashboard.
   */
  /*
   * Cast explicitly: `find` casts string ids for us, but the aggregate below
   * does not, and an uncast id there silently matches nothing.
   */
  const scope: FilterQuery<IProductionOrder> = {};
  if (companyId) scope.company = new Types.ObjectId(companyId);
  if (sampleId) scope.sample = new Types.ObjectId(sampleId);

  const filter: FilterQuery<IProductionOrder> = { ...scope };

  if (status === "OVERDUE") Object.assign(filter, overdueFilter());
  else if (status) filter.status = status;

  /*
   * The date range is on `createdAt` — when the order was taken in — because
   * that is the question being asked ("what did we take last month"), not when
   * it is due. Both ends are inclusive of their whole day, using the same UTC
   * normalisation the log entries are written with, so a range of one day
   * matches the orders raised on that day rather than none of them.
   */
  if (from || to) {
    filter.createdAt = {
      ...(from ? { $gte: startOfDayUTC(from) } : {}),
      ...(to ? { $lt: endOfDayUTC(to) } : {}),
    };
  }

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
     * The pill counts are of the whole scope, not the current page or filter
     * — a badge that changed when you clicked it would be useless.
     */
    ProductionOrder.aggregate<{ _id: OrderStatus; count: number }>([
      { $match: scope },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
    ProductionOrder.countDocuments({ ...scope, ...overdueFilter() }).exec(),
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

/** The fields a caller may set on an order, when converting a sample or editing. */
export interface OrderFields {
  designNumber: string;
  status?: OrderStatus;
  orderedMetres: number;
  fabricType?: string;
  fabricWidth?: string;
  yarnType?: string;
  yarnColor?: string;
  repeat?: string;
  stitches?: number;
  startDate?: string;
  deadline?: string;
  estCompletion?: string;
  machine?: string;
  operator?: string;
  mendings?: number;
  rejectedMetres?: number;
  remarks?: string;
}

/**
 * A new order is raised one of two ways:
 *
 *   - converted from a sample (`sampleId`) — the usual way. The sample carries
 *     the buyer and the design, and moves to IN_PRODUCTION.
 *   - created directly for a buyer (`companyId`) — for work that needed no
 *     sample: a repeat of a design already made, or an order from a swatch.
 *
 * When both are sent the sample decides, and must belong to that buyer.
 */
export interface OrderInput extends OrderFields {
  sampleId?: string;
  companyId?: string;
  /** Copy the sample's design image when no image of its own is uploaded. */
  useSampleImage?: boolean;
}

/**
 * A sample that may be converted into an order: still open.
 *
 * In progress is accepted as well as approved — taking the order is the
 * buyer's approval, whether or not anyone marked the sample first. One already
 * in production has its order; one rejected has to be reopened before it can
 * become one.
 */
const convertibleSample = async (sampleId: string): Promise<ISample> => {
  const sample = await Sample.findById(sampleId).exec();
  if (!sample) throw new ApiError(404, "That sample no longer exists");

  if (sample.status === SAMPLE_STATUS.IN_PRODUCTION) {
    throw new ApiError(409, `Sample ${sample.sampleNumber} is already in production as an order.`);
  }

  if (sample.status === SAMPLE_STATUS.REJECTED) {
    throw new ApiError(
      422,
      `Sample ${sample.sampleNumber} was rejected. Reopen it before converting it into an order.`
    );
  }

  return sample;
};

type DesignUpload = { buffer: Buffer; filename: string };

/** Raise a new order: convert a sample, or create one directly for a buyer. */
export const createOrder = (
  input: OrderInput,
  createdBy: Types.ObjectId,
  image?: DesignUpload
): Promise<OrderView> =>
  input.sampleId
    ? convertSample(input.sampleId, input, createdBy, image)
    : createDirect(input, createdBy, image);

/**
 * A new order for a buyer, with no sample behind it.
 *
 * The company is looked up rather than trusted: `companyName` is a snapshot
 * the list renders directly, so it must come from the record, never from
 * whatever the client happened to send.
 */
const createDirect = async (
  input: OrderInput,
  createdBy: Types.ObjectId,
  image?: DesignUpload
): Promise<OrderView> => {
  if (!input.companyId) {
    throw new ApiError(422, "Choose a company, or pick a sample to convert.");
  }

  const company = await Company.findById(input.companyId).exec();
  if (!company) throw new ApiError(404, "That company no longer exists");

  const uploaded = image ? await uploadImage(image.buffer, image.filename, IMAGE_FOLDER) : null;

  try {
    // After the upload, so a failed image does not burn a number.
    const orderNumber = await generateOrderNumber(company.name);
    const { sampleId: _s, companyId: _c, useSampleImage: _u, ...fields } = input;

    const order = await ProductionOrder.create({
      ...fields,
      orderNumber,
      company: company._id,
      companyName: company.name,
      sample: null,
      sampleNumber: "",
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

/**
 * Convert a sample into a production order.
 *
 * The sample moves to IN_PRODUCTION — out of the Sampling list, into its "In
 * production" tab — and the order carries its buyer, design and a link back.
 */
const convertSample = async (
  sampleId: string,
  input: OrderInput,
  createdBy: Types.ObjectId,
  image?: DesignUpload
): Promise<OrderView> => {
  const sample = await convertibleSample(sampleId);

  // A buyer sent alongside the sample must be the sample's own.
  if (input.companyId && String(input.companyId) !== String(sample.company)) {
    throw new ApiError(422, `Sample ${sample.sampleNumber} belongs to another company.`);
  }

  /*
   * The company is looked up rather than trusted from the sample's snapshot:
   * `companyName` is what the list renders directly, so it must be current.
   */
  const company = await Company.findById(sample.company).exec();
  if (!company) throw new ApiError(404, "That sample's company no longer exists");

  /*
   * An uploaded file always wins. Otherwise the sample's design is copied —
   * only when asked, so an order never picks up an image nobody chose.
   */
  const uploaded = image
    ? await uploadImage(image.buffer, image.filename, IMAGE_FOLDER)
    : sample.designImage?.url && input.useSampleImage
      ? await copyImage(sample.designImage.url, IMAGE_FOLDER)
      : null;

  /*
   * Claim the sample before writing the order. The update only matches while
   * the sample is still open, so two people converting the same sample at
   * once cannot both get an order out of it — the second finds nothing to
   * claim. Converting without an approval on record stamps one now.
   */
  const claimed = await Sample.findOneAndUpdate(
    { _id: sample._id, status: { $in: OPEN_SAMPLE_STATUSES } },
    {
      $set: {
        status: SAMPLE_STATUS.IN_PRODUCTION,
        decidedAt: sample.decidedAt ?? new Date(),
        updatedBy: createdBy,
      },
    },
    { new: true }
  ).exec();

  if (!claimed) {
    if (uploaded) await destroyImage(uploaded.publicId);
    throw new ApiError(
      409,
      `Sample ${sample.sampleNumber} has just been converted into an order by someone else.`
    );
  }

  try {
    /*
     * Claimed after the upload, so a failed image does not burn a number and
     * leave a gap in the buyer's sequence. A gap is not a correctness problem,
     * but a sequence the office can read straight down is worth the ordering.
     */
    const orderNumber = await generateOrderNumber(company.name);
    const { sampleId: _s, companyId: _c, useSampleImage: _u, ...fields } = input;

    const order = await ProductionOrder.create({
      // The design's repeat and stitches carry over unless this order says otherwise.
      repeat: sample.repeat,
      stitches: sample.stitches,
      ...fields,
      orderNumber,
      company: company._id,
      companyName: company.name,
      sample: sample._id,
      sampleNumber: sample.sampleNumber,
      // Never from the client: the log is the only thing that moves this.
      completedMetres: 0,
      ...(uploaded ? { designImage: uploaded } : {}),
      createdBy,
      updatedBy: createdBy,
    });

    return toView(order);
  } catch (error) {
    /*
     * Hand the sample back exactly as it was, so a failed save does not strand
     * it in production with no order behind it. And the file is already on
     * Cloudinary but the row failed — remove it rather than leave an asset
     * nothing points at.
     */
    await Sample.updateOne(
      { _id: sample._id, status: SAMPLE_STATUS.IN_PRODUCTION },
      sample.decidedAt
        ? { $set: { status: sample.status, decidedAt: sample.decidedAt } }
        : { $set: { status: sample.status }, $unset: { decidedAt: 1 } }
    ).exec();
    if (uploaded) await destroyImage(uploaded.publicId);
    throw error;
  }
};

export type OrderPatch = Partial<OrderFields> & { companyId?: string };

/**
 * Save an order's fields.
 *
 * `completedMetres` is deliberately absent from what a caller may set — it is
 * derived from the log, and letting it be typed here is exactly the drift this
 * design exists to prevent. So is the sample: an order is the sample it was
 * converted from, and that does not change afterwards.
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
    // Only an order with no sample behind it can move — one converted from a
    // sample belongs to that sample's buyer.
    if (order.sample) {
      throw new ApiError(
        422,
        `This order was converted from sample ${order.sampleNumber}, so its buyer cannot change.`
      );
    }

    const company = await Company.findById(patch.companyId).exec();
    if (!company) throw new ApiError(404, "That company no longer exists");
    order.company = company._id as Types.ObjectId;
    order.companyName = company.name;
  }

  const { companyId: _c, ...fields } = patch;
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

  /*
   * Work having started is what RUNNING means, so the first positive entry
   * moves it rather than making someone remember to. This also fires from the
   * legacy SAMPLING status, so an unmigrated row cannot stay stuck in it.
   */
  const started =
    order.status === LEGACY_ORDER_STATUS.SAMPLING || order.status === ORDER_STATUS.PENDING;
  const status = started && input.metres > 0 ? ORDER_STATUS.RUNNING : order.status;

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

  /*
   * The sample goes back to sampling, approved — ready to be converted again.
   * Only if no other order still points at it, which can be the case for data
   * written before a sample became exactly one order.
   */
  if (order.sample && !(await ProductionOrder.exists({ sample: order.sample }))) {
    await Sample.updateOne(
      { _id: order.sample, status: SAMPLE_STATUS.IN_PRODUCTION },
      { $set: { status: SAMPLE_STATUS.APPROVED } }
    ).exec();
  }

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
  samples: Record<string, number>;
}

/** The figures behind the dashboard strip. */
export const getSummary = async (): Promise<SummaryResult> => {
  const [totals, byStatus, overdue, today, companies, samples] = await Promise.all([
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
    sampleCounts(),
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
    samples,
  };
};
