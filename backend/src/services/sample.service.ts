import { Types, type FilterQuery } from "mongoose";
import {
  Sample,
  SAMPLE_STATUS,
  OPEN_SAMPLE_STATUSES,
  type ISample,
  type SampleStatus,
} from "../models/sample.model.js";
import { ProductionOrder } from "../models/productionOrder.model.js";
import { Company, type ICompany } from "../models/company.model.js";
import { docketNumbering } from "../utils/docketNumber.js";
import { uploadImage, destroyImage } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { startOfDayUTC } from "../utils/productionDate.js";

/** Same Cloudinary folder as order design images — they are the same kind of file. */
const IMAGE_FOLDER = "inventory";

/** Sample numbers, e.g. `Dexter-SMP-00012`. A separate sequence from orders. */
const sampleNumbers = docketNumbering("sample", "SMP");

export const previewSampleNumber = async (companyId: string): Promise<string> => {
  const company = await Company.findById(companyId).select("name").lean<ICompany>().exec();
  if (!company) throw new ApiError(404, "That company no longer exists");

  return sampleNumbers.peek(company.name);
};

/** A sample still with the floor or the buyer, past its date. */
const isOverdue = (sample: { deadline?: Date | null; status: SampleStatus }): boolean =>
  Boolean(
    sample.deadline &&
      OPEN_SAMPLE_STATUSES.includes(sample.status) &&
      new Date(sample.deadline).getTime() < startOfDayUTC().getTime()
  );

export type SampleView = Record<string, unknown> & { isOverdue: boolean };

const toView = (sample: ISample | Record<string, unknown>): SampleView => {
  const plain = (
    typeof (sample as ISample).toObject === "function" ? (sample as ISample).toObject() : sample
  ) as Record<string, unknown> & { deadline?: Date; status: SampleStatus };

  return { ...plain, isOverdue: isOverdue(plain) };
};

export interface ListOptions {
  status?: SampleStatus;
  companyId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListResult {
  items: SampleView[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  statusCounts: Record<string, number>;
}

/**
 * Paginated, newest first.
 *
 * The pill counts follow the company filter but not the status or search:
 * inside a company's dashboard the badges must be that buyer's numbers, while
 * a badge that changed when you clicked it would be useless.
 */
export const listSamples = async ({
  status,
  companyId,
  search,
  page = 1,
  limit = 20,
}: ListOptions = {}): Promise<ListResult> => {
  // Cast explicitly — the aggregate below does not cast string ids the way `find` does.
  const scope: FilterQuery<ISample> = {};
  if (companyId) scope.company = new Types.ObjectId(companyId);

  const filter: FilterQuery<ISample> = { ...scope };
  if (status) filter.status = status;

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ sampleNumber: rx }, { designNumber: rx }, { companyName: rx }];
  }

  const skip = (page - 1) * limit;

  const [items, total, byStatus] = await Promise.all([
    Sample.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<ISample[]>().exec(),
    Sample.countDocuments(filter).exec(),
    Sample.aggregate<{ _id: SampleStatus; count: number }>([
      { $match: scope },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
  ]);

  const statusCounts: Record<string, number> = {};
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

/**
 * The orders confirmed from a sample, and what they add up to.
 *
 * This is the Sampling → Order → Production chain made visible: one approved
 * sample can be ordered more than once, and the office needs to see how much
 * of it has been produced across all of them.
 */
const ordersFromSample = async (sampleId: Types.ObjectId) => {
  const orders = await ProductionOrder.find({ sample: sampleId })
    .select("orderNumber status orderedMetres completedMetres deadline createdAt")
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const ordered = orders.reduce((sum, o) => sum + (o.orderedMetres ?? 0), 0);
  const produced = orders.reduce((sum, o) => sum + (o.completedMetres ?? 0), 0);

  return {
    orders,
    totals: { ordered, produced, remaining: Math.max(0, ordered - produced) },
  };
};

/** One sample, with the orders raised from it. */
export const getSample = async (id: string): Promise<SampleView> => {
  const sample = await Sample.findById(id).exec();
  if (!sample) throw new ApiError(404, "That sample no longer exists");

  const { orders, totals } = await ordersFromSample(sample._id as Types.ObjectId);
  return { ...toView(sample), orders, orderTotals: totals };
};

export interface SampleInput {
  companyId: string;
  designNumber: string;
  status?: SampleStatus;
  fabricType?: string;
  fabricWidth?: string;
  yarnType?: string;
  yarnColor?: string;
  repeat?: number;
  stitches?: number;
  quantity?: number;
  deadline?: string;
  remarks?: string;
}

/**
 * The timestamps a status carries. Set on the way in, never cleared on the
 * way out — the history keeps "sent on the 3rd" even after the buyer answers.
 */
const statusStamps = (status: SampleStatus | undefined, existing?: ISample) => {
  const now = new Date();
  const stamps: Partial<Pick<ISample, "sentAt" | "decidedAt">> = {};

  // The edit form sends the status on every save; only a real change is an event.
  if (!status || status === existing?.status) return stamps;

  if (status === SAMPLE_STATUS.SENT && !existing?.sentAt) stamps.sentAt = now;
  if (status === SAMPLE_STATUS.APPROVED || status === SAMPLE_STATUS.REJECTED) {
    stamps.decidedAt = now;
    // Answered without anyone recording that it went out — it evidently did.
    if (!existing?.sentAt) stamps.sentAt = now;
  }

  return stamps;
};

export const createSample = async (
  input: SampleInput,
  createdBy: Types.ObjectId,
  image?: { buffer: Buffer; filename: string }
): Promise<SampleView> => {
  const company = await Company.findById(input.companyId).exec();
  if (!company) throw new ApiError(404, "That company no longer exists");

  const uploaded = image ? await uploadImage(image.buffer, image.filename, IMAGE_FOLDER) : null;

  try {
    const sampleNumber = await sampleNumbers.next(company.name);
    const { companyId: _ignored, ...fields } = input;

    const sample = await Sample.create({
      ...fields,
      ...statusStamps(input.status),
      sampleNumber,
      company: company._id,
      companyName: company.name,
      ...(uploaded ? { designImage: uploaded } : {}),
      createdBy,
      updatedBy: createdBy,
    });

    return toView(sample);
  } catch (error) {
    if (uploaded) await destroyImage(uploaded.publicId);
    throw error;
  }
};

export type SamplePatch = Partial<Omit<SampleInput, "companyId">> & { companyId?: string };

export const updateSample = async (
  id: string,
  patch: SamplePatch,
  updatedBy: Types.ObjectId
): Promise<SampleView> => {
  const sample = await Sample.findById(id).exec();
  if (!sample) throw new ApiError(404, "That sample no longer exists");

  if (patch.companyId && String(patch.companyId) !== String(sample.company)) {
    // Its orders are that buyer's orders; moving the sample would split them.
    const linked = await ProductionOrder.countDocuments({ sample: sample._id }).exec();
    if (linked > 0) {
      throw new ApiError(409, "Orders have been raised from this sample, so its buyer cannot change.");
    }

    const company = await Company.findById(patch.companyId).exec();
    if (!company) throw new ApiError(404, "That company no longer exists");
    sample.company = company._id as Types.ObjectId;
    sample.companyName = company.name;
  }

  const { companyId: _ignored, ...fields } = patch;
  Object.assign(sample, fields, statusStamps(patch.status, sample));
  sample.updatedBy = updatedBy;

  await sample.save();
  return getSample(String(sample._id));
};

export const setStatus = async (
  id: string,
  status: SampleStatus,
  updatedBy: Types.ObjectId
): Promise<SampleView> => updateSample(id, { status }, updatedBy);

export const setImage = async (
  id: string,
  buffer: Buffer,
  filename: string
): Promise<SampleView> => {
  const sample = await Sample.findById(id).exec();
  if (!sample) throw new ApiError(404, "That sample no longer exists");

  const previous = sample.designImage?.publicId;
  const uploaded = await uploadImage(buffer, filename, IMAGE_FOLDER);

  sample.designImage = uploaded;
  await sample.save();

  if (previous && previous !== uploaded.publicId) await destroyImage(previous);
  return getSample(id);
};

export const clearImage = async (id: string): Promise<SampleView> => {
  const sample = await Sample.findById(id).exec();
  if (!sample) throw new ApiError(404, "That sample no longer exists");

  const publicId = sample.designImage?.publicId;
  sample.designImage = {};
  await sample.save();

  if (publicId) await destroyImage(publicId);
  return getSample(id);
};

/**
 * Delete, but never orphan an order's origin.
 *
 * Refused while orders point at it, for the same reason a company with orders
 * cannot be deleted: those orders are the record of work done.
 */
export const deleteSample = async (id: string): Promise<void> => {
  const sample = await Sample.findById(id).exec();
  if (!sample) throw new ApiError(404, "That sample no longer exists");

  const linked = await ProductionOrder.countDocuments({ sample: sample._id }).exec();
  if (linked > 0) {
    throw new ApiError(
      409,
      `${linked} order${linked === 1 ? " was" : "s were"} raised from this sample. ` +
        `Delete or unlink ${linked === 1 ? "it" : "them"} first.`
    );
  }

  await sample.deleteOne();
  if (sample.designImage?.publicId) await destroyImage(sample.designImage.publicId);
};

/** Open samples, across every buyer — for the statistics strip. */
export const sampleCounts = async (): Promise<Record<string, number>> => {
  const [byStatus, overdue] = await Promise.all([
    Sample.aggregate<{ _id: SampleStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
    Sample.countDocuments({
      deadline: { $ne: null, $lt: startOfDayUTC() },
      status: { $in: OPEN_SAMPLE_STATUSES },
    }).exec(),
  ]);

  const counts: Record<string, number> = { OVERDUE: overdue, TOTAL: 0, OPEN: 0 };
  for (const row of byStatus) {
    counts[row._id] = row.count;
    counts.TOTAL = (counts.TOTAL ?? 0) + row.count;
    if (OPEN_SAMPLE_STATUSES.includes(row._id)) counts.OPEN = (counts.OPEN ?? 0) + row.count;
  }

  return counts;
};
