import type { FilterQuery, Types } from "mongoose";
import {
  Company,
  type ICompany,
  type ICompanyContact,
} from "../models/company.model.js";
import { ProductionOrder } from "../models/productionOrder.model.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";

export interface ListOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CompanyListItem extends ICompany {
  orderCount: number;
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
 * How many orders each company on this page has.
 *
 * One grouped aggregate for the whole page rather than a count per row, so the
 * cost is a single extra query regardless of the page size.
 */
const withOrderCounts = async (companies: ICompany[]): Promise<CompanyListItem[]> => {
  if (!companies.length) return [];

  const ids = companies.map((c) => c._id);
  const counts = await ProductionOrder.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { company: { $in: ids } } },
    { $group: { _id: "$company", count: { $sum: 1 } } },
  ]).exec();

  const byId = new Map(counts.map((c) => [String(c._id), c.count]));

  return companies.map((c) => ({
    ...withContacts(c),
    orderCount: byId.get(String(c._id)) ?? 0,
  })) as CompanyListItem[];
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
    await ProductionOrder.updateMany(
      { company: company._id },
      { $set: { companyName: renamedTo } }
    ).exec();
  }

  return company;
};

/**
 * Delete, but never orphan an order.
 *
 * A company with orders against it is refused rather than cascaded: those
 * orders are the record of work done and paid for, and deleting a buyer should
 * not quietly take them with it.
 */
export const deleteCompany = async (id: string): Promise<void> => {
  const company = await getCompany(id);

  const orderCount = await ProductionOrder.countDocuments({ company: company._id }).exec();

  if (orderCount > 0) {
    throw new ApiError(
      409,
      `This company has ${orderCount} order${orderCount === 1 ? "" : "s"}. ` +
        `Delete those first, or deactivate the company instead.`
    );
  }

  await company.deleteOne();
};
