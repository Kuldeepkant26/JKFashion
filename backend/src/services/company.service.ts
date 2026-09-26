import type { FilterQuery, Types } from "mongoose";
import {
  Company,
  type ICompany,
  type ICompanyContact,
} from "../models/company.model.js";
import {
  ProductionOrder,
  OPEN_ORDER_STATUSES,
  ORDER_STATUS,
} from "../models/productionOrder.model.js";
import {
  Sample,
  SAMPLE_STATUS,
  OPEN_SAMPLE_STATUSES,
  SAMPLING_STATUSES,
} from "../models/sample.model.js";
import { uploadImage, destroyImage } from "../config/cloudinary.js";
import { startOfDayUTC } from "../utils/productionDate.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";

export interface ListOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CompanyListItem extends ICompany {
  orderCount: number;
  activeOrders: number;
  sampleCount: number;
  openSamples: number;
}

/**
 * Present a company's contacts as rows, whatever shape they are stored in.
 *
 * A row written before `contacts` existed carries its detail in the legacy
 * free-text `contact` field. Rather than migrating the collection, that text is
 * surfaced as a single name-only row, so the UI has exactly one shape to render
 * and the original wording is preserved until someone edits it.
 */
const withContacts = <T extends { contacts?: ICompanyContact[]; contact?: string }>(
  company: T
): T => {
  if (company.contacts?.length) return company;
  if (!company.contact?.trim()) return { ...company, contacts: [] };

  return {
    ...company,
    contacts: [{ name: company.contact.trim(), phone: "", email: "" }],
  };
};

export interface ListResult {
  items: CompanyListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Paginated, alphabetical.
 *
 * Sorted by name rather than newest-first — unlike enquiries, a buyer is
 * something you go looking for by name, so A–Z is what makes the list usable.
 */
export const listCompanies = async ({
  search,
  page = 1,
  limit = 20,
}: ListOptions = {}): Promise<ListResult> => {
  const filter: FilterQuery<ICompany> = {};

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { name: rx },
      { location: rx },
      { "contacts.name": rx },
      { "contacts.phone": rx },
      { "contacts.email": rx },
      // Still matched so buyers not yet re-saved remain findable by contact.
      { contact: rx },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Company.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean<ICompany[]>().exec(),
    Company.countDocuments(filter).exec(),
  ]);

  return {
    items: await withOrderCounts(items),
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
};

/**
 * What each company on this page has on the go — orders and samples, total
 * and still open — so the list can say where work is without opening a buyer.
 *
 * Two grouped aggregates for the whole page rather than counts per row, so the
 * cost is fixed regardless of the page size.
 */
const withOrderCounts = async (companies: ICompany[]): Promise<CompanyListItem[]> => {
  if (!companies.length) return [];

  const ids = companies.map((c) => c._id);
  type Row = { _id: Types.ObjectId; count: number; open: number };

  const [orders, samples] = await Promise.all([
    ProductionOrder.aggregate<Row>([
      { $match: { company: { $in: ids } } },
      {
        $group: {
          _id: "$company",
          count: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ["$status", OPEN_ORDER_STATUSES] }, 1, 0] } },
        },
      },
    ]).exec(),
    Sample.aggregate<Row>([
      { $match: { company: { $in: ids } } },
      {
        $group: {
          _id: "$company",
          count: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ["$status", OPEN_SAMPLE_STATUSES] }, 1, 0] } },
        },
      },
    ]).exec(),
  ]);

  const orderBy = new Map(orders.map((r) => [String(r._id), r]));
  const sampleBy = new Map(samples.map((r) => [String(r._id), r]));

  return companies.map((c) => {
    const o = orderBy.get(String(c._id));
    const smp = sampleBy.get(String(c._id));
    return {
      ...withContacts(c),
      orderCount: o?.count ?? 0,
      activeOrders: o?.open ?? 0,
      sampleCount: smp?.count ?? 0,
      openSamples: smp?.open ?? 0,
    };
  }) as CompanyListItem[];
};

/**
 * The document itself — for the service's own writes, which need a live
 * Mongoose document rather than a presented one.
 */
export const getCompany = async (id: string): Promise<ICompany> => {
  const company = await Company.findById(id).exec();
  if (!company) throw new ApiError(404, "That company no longer exists");
  return company;
};

/** The same company as the API returns it, with legacy contacts folded in. */
export const getCompanyView = async (id: string): Promise<Record<string, unknown>> =>
  withContacts((await getCompany(id)).toObject());

export interface CompanyInput {
  name: string;
  address?: string;
  location?: string;
  gst?: string;
  contacts?: ICompanyContact[];
}

export const createCompany = async (
  input: CompanyInput,
  createdBy: Types.ObjectId
): Promise<ICompany> => Company.create({ ...input, createdBy });

export interface CompanyPatch {
  name?: string;
  address?: string;
  location?: string;
  gst?: string;
  contacts?: ICompanyContact[];
  isActive?: boolean;
}

/**
 * Save a company, keeping the orders' denormalised name in step.
 *
 * Orders carry a `companyName` snapshot so the list needs no join. That makes
 * a rename the one write that has to fan out — a single indexed updateMany,
 * and renames are rare. Without it, old orders would show the old name for ever.
 */
export const updateCompany = async (
  id: string,
  patch: CompanyPatch
): Promise<ICompany> => {
  const company = await getCompany(id);
  const renamedTo =
    patch.name !== undefined && patch.name !== company.name ? patch.name : null;

  Object.assign(company, patch);

  /*
   * Once structured contacts are written, the legacy free text has been
   * superseded — it was only ever shown by being folded into that same list.
   * Leaving it would make the row match a search for a contact it no longer
   * claims to have.
   */
  if (patch.contacts !== undefined) company.contact = "";

  await company.save();

  if (renamedTo) {
    await Promise.all([
      ProductionOrder.updateMany(
        { company: company._id },
        { $set: { companyName: renamedTo } }
      ).exec(),
      Sample.updateMany({ company: company._id }, { $set: { companyName: renamedTo } }).exec(),
    ]);
  }

  return company;
};

/**
 * Delete, but never orphan an order or a sample.
 *
 * A company with work against it is refused rather than cascaded: those
 * records are the history of work done and paid for, and deleting a buyer
 * should not quietly take them with it.
 */
export const deleteCompany = async (id: string): Promise<void> => {
  const company = await getCompany(id);

  const [orderCount, sampleCount] = await Promise.all([
    ProductionOrder.countDocuments({ company: company._id }).exec(),
    Sample.countDocuments({ company: company._id }).exec(),
  ]);

  if (orderCount > 0 || sampleCount > 0) {
    const parts = [
      orderCount ? `${orderCount} order${orderCount === 1 ? "" : "s"}` : "",
      sampleCount ? `${sampleCount} sample${sampleCount === 1 ? "" : "s"}` : "",
    ].filter(Boolean);

    throw new ApiError(
      409,
      `This company has ${parts.join(" and ")}. Delete those first, or deactivate the company instead.`
    );
  }

  await company.deleteOne();
  if (company.logo?.publicId) await destroyImage(company.logo.publicId);
};

/* ------------------------------------------------------------------ logo */

/** Logos live apart from design images, so the two can never be confused. */
const LOGO_FOLDER = "companies";

export const setLogo = async (
  id: string,
  buffer: Buffer,
  filename: string
): Promise<Record<string, unknown>> => {
  const company = await getCompany(id);

  const previous = company.logo?.publicId;
  const uploaded = await uploadImage(buffer, filename, LOGO_FOLDER);

  company.logo = uploaded;
  await company.save();

  // Only after the new one is stored, and only if it really changed.
  if (previous && previous !== uploaded.publicId) await destroyImage(previous);
  return withContacts(company.toObject());
};

export const clearLogo = async (id: string): Promise<Record<string, unknown>> => {
  const company = await getCompany(id);

  const publicId = company.logo?.publicId;
  company.logo = {};
  await company.save();

  if (publicId) await destroyImage(publicId);
  return withContacts(company.toObject());
};

/* -------------------------------------------------------------- overview */

export type ActivityKind =
  | "SAMPLE_CREATED"
  | "SAMPLE_APPROVED"
  | "SAMPLE_REJECTED"
  | "ORDER_CREATED"
  | "PRODUCTION_LOGGED";

export interface ActivityItem {
  kind: ActivityKind;
  date: Date;
  /** What the entry is about, for the link: a sample or an order. */
  ref: { type: "sample" | "order"; id: string; number: string };
  designNumber: string;
  metres?: number;
  note?: string;
  by?: string;
}

/** Enough history to read back a season; older work is in the lists. */
const ACTIVITY_LIMIT = 80;

/**
 * Everything that has happened for one buyer, newest first.
 *
 * Assembled from the records themselves — sample dates, order creation, the
 * production log — rather than kept in a separate audit collection, so it
 * cannot disagree with them. What it cannot show is anything those records do
 * not carry: a status that changed and changed back leaves no trace here.
 */
const companyActivity = async (companyId: Types.ObjectId): Promise<ActivityItem[]> => {
  const [samples, orders, logs] = await Promise.all([
    Sample.find({ company: companyId })
      .select("sampleNumber designNumber status createdAt decidedAt")
      .sort({ createdAt: -1 })
      .limit(ACTIVITY_LIMIT)
      .lean()
      .exec(),
    ProductionOrder.find({ company: companyId })
      .select("orderNumber designNumber orderedMetres sampleNumber createdAt")
      .sort({ createdAt: -1 })
      .limit(ACTIVITY_LIMIT)
      .lean()
      .exec(),
    ProductionOrder.aggregate<{
      _id: Types.ObjectId;
      orderNumber: string;
      designNumber: string;
      entry: { date: Date; metres: number; note: string; loggedByName: string };
    }>([
      { $match: { company: companyId } },
      { $project: { orderNumber: 1, designNumber: 1, log: 1 } },
      { $unwind: "$log" },
      { $sort: { "log.date": -1, "log.createdAt": -1 } },
      { $limit: ACTIVITY_LIMIT },
      { $project: { orderNumber: 1, designNumber: 1, entry: "$log" } },
    ]).exec(),
  ]);

  const items: ActivityItem[] = [];

  for (const smp of samples) {
    const ref = { type: "sample" as const, id: String(smp._id), number: smp.sampleNumber };
    const base = { ref, designNumber: smp.designNumber };

    items.push({ ...base, kind: "SAMPLE_CREATED", date: smp.createdAt });
    // A sample in production was approved on the way — converting it records that.
    if (
      smp.decidedAt &&
      (smp.status === SAMPLE_STATUS.APPROVED || smp.status === SAMPLE_STATUS.IN_PRODUCTION)
    ) {
      items.push({ ...base, kind: "SAMPLE_APPROVED", date: smp.decidedAt });
    }
    if (smp.decidedAt && smp.status === SAMPLE_STATUS.REJECTED) {
      items.push({ ...base, kind: "SAMPLE_REJECTED", date: smp.decidedAt });
    }
  }

  for (const order of orders) {
    items.push({
      kind: "ORDER_CREATED",
      date: order.createdAt,
      ref: { type: "order", id: String(order._id), number: order.orderNumber },
      designNumber: order.designNumber,
      metres: order.orderedMetres,
      note: order.sampleNumber ? `From sample ${order.sampleNumber}` : "",
    });
  }

  for (const row of logs) {
    items.push({
      kind: "PRODUCTION_LOGGED",
      date: row.entry.date,
      ref: { type: "order", id: String(row._id), number: row.orderNumber },
      designNumber: row.designNumber,
      metres: row.entry.metres,
      note: row.entry.note,
      by: row.entry.loggedByName,
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items.slice(0, ACTIVITY_LIMIT);
};

/**
 * One buyer's dashboard: the company, its figures, and its history.
 *
 * The lists of its samples and orders are fetched separately, through the
 * ordinary list endpoints filtered by company, so they page and search the
 * same way they do everywhere else.
 */
export const getCompanyOverview = async (id: string): Promise<Record<string, unknown>> => {
  const company = await getCompany(id);
  const companyId = company._id as Types.ObjectId;

  const [orderStats, sampleStats, overdueOrders, activity] = await Promise.all([
    ProductionOrder.aggregate<{
      _id: string;
      count: number;
      ordered: number;
      produced: number;
    }>([
      { $match: { company: companyId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          ordered: { $sum: "$orderedMetres" },
          produced: { $sum: "$completedMetres" },
        },
      },
    ]).exec(),
    Sample.aggregate<{ _id: string; count: number }>([
      { $match: { company: companyId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
    ProductionOrder.countDocuments({
      company: companyId,
      deadline: { $ne: null, $lt: startOfDayUTC() },
      status: { $in: OPEN_ORDER_STATUSES },
    }).exec(),
    companyActivity(companyId),
  ]);

  const orders = { total: 0, active: 0, completed: 0, overdue: overdueOrders };
  const metres = { ordered: 0, produced: 0, remaining: 0 };
  for (const row of orderStats) {
    orders.total += row.count;
    if (OPEN_ORDER_STATUSES.includes(row._id as never)) orders.active += row.count;
    if (row._id === ORDER_STATUS.COMPLETED) orders.completed += row.count;
    metres.ordered += row.ordered;
    metres.produced += row.produced;
  }
  metres.remaining = Math.max(0, metres.ordered - metres.produced);

  /*
   * `sampling` is everything not yet converted — what the buyer's Sampling
   * list shows under "All" — and `open` the part of it still in play.
   */
  const samples: Record<string, number> = { total: 0, open: 0, sampling: 0 };
  for (const row of sampleStats) {
    samples[row._id] = row.count;
    samples.total! += row.count;
    if (OPEN_SAMPLE_STATUSES.includes(row._id as never)) samples.open! += row.count;
    if (SAMPLING_STATUSES.includes(row._id as never)) samples.sampling! += row.count;
  }

  return {
    company: withContacts(company.toObject()),
    stats: { orders, metres, samples },
    activity,
  };
};
