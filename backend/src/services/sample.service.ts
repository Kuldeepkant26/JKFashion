import { Types, type FilterQuery } from "mongoose";
import {
  Sample,
  SAMPLE_STATUS,
  SAMPLING_STATUSES,
  OPEN_SAMPLE_STATUSES,
  type ISample,
  type SampleStatus,
} from "../models/sample.model.js";
import { ProductionOrder } from "../models/productionOrder.model.js";
import { Company, type ICompany } from "../models/company.model.js";
import { jobNumbers } from "../utils/docketNumber.js";
import { uploadImage, destroyImage } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { startOfDayUTC } from "../utils/productionDate.js";

/** Same Cloudinary folder as order design images — they are the same kind of file. */
const IMAGE_FOLDER = "inventory";

export const previewSampleNumber = async (companyId: string): Promise<string> => {
  const company = await Company.findById(companyId).select("name").lean<ICompany>().exec();
  if (!company) throw new ApiError(404, "That company no longer exists");

  return jobNumbers.peek(company.name);
};

/**
 * A sample still being made, past the date it was due to the buyer. Once it
 * is approved the sample itself has been delivered, so it can no longer be late.
 */
const isOverdue = (sample: { deadline?: Date | null; status: SampleStatus }): boolean =>
  Boolean(
    sample.deadline &&
      sample.status === SAMPLE_STATUS.IN_PROGRESS &&
      new Date(sample.deadline).getTime() < startOfDayUTC().getTime()
  );

const overdueFilter = (): FilterQuery<ISample> => ({
  deadline: { $ne: null, $lt: startOfDayUTC() },
  status: SAMPLE_STATUS.IN_PROGRESS,
});

export type SampleView = Record<string, unknown> & { isOverdue: boolean };

const toView = (sample: ISample | Record<string, unknown>): SampleView => {
  const plain = (
    typeof (sample as ISample).toObject === "function" ? (sample as ISample).toObject() : sample
  ) as Record<string, unknown> & { deadline?: Date; status: SampleStatus };

  return { ...plain, isOverdue: isOverdue(plain) };
};

/**
 * The list's status filter: one status, or a group.
 *
 * SAMPLING is the Sampling list's "All" — everything not yet converted, since
 * a converted sample has left sampling for its "In production" tab. OPEN is
 * what a new order may be converted from.
 */
export type SampleListStatus = SampleStatus | "SAMPLING" | "OPEN";

const STATUS_GROUPS: Record<string, SampleStatus[]> = {
  SAMPLING: SAMPLING_STATUSES,
  OPEN: OPEN_SAMPLE_STATUSES,
};

export interface ListOptions {
  status?: SampleListStatus;
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
  if (status) {
    const group = STATUS_GROUPS[status];
    filter.status = group ? { $in: group } : status;
  }

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

  const statusCounts: Record<string, number> = { SAMPLING: 0, OPEN: 0 };
  for (const row of byStatus) {
    statusCounts[row._id] = row.count;
    if (SAMPLING_STATUSES.includes(row._id)) statusCounts.SAMPLING! += row.count;
    if (OPEN_SAMPLE_STATUSES.includes(row._id)) statusCounts.OPEN! += row.count;
  }

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
 * The production order this sample was converted into, with what is left on
 * it — the Sampling → Order → Production chain for this design.
 *
 * One order per sample. The newest is taken so that data written before that
 * rule (when a sample could be ordered more than once) still shows something.
 */
const convertedOrder = async (sampleId: Types.ObjectId) => {
  const order = await ProductionOrder.findOne({ sample: sampleId })
    .select("orderNumber status orderedMetres completedMetres deadline createdAt")
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  if (!order) return null;

  return {
    ...order,
    remainingMetres: Math.max(0, (order.orderedMetres ?? 0) - (order.completedMetres ?? 0)),
  };
};

/** One sample, with the order it became, if it has become one. */
export const getSample = async (id: string): Promise<SampleView> => {
  const sample = await Sample.findById(id).exec();
  if (!sample) throw new ApiError(404, "That sample no longer exists");

  return { ...toView(sample), order: await convertedOrder(sample._id as Types.ObjectId) };
};

export interface SampleInput {
  companyId: string;
  designNumber: string;
  status?: SampleStatus;
  fabricType?: string;
  fabricWidth?: string;
  yarnType?: string;
  yarnColor?: string;
  repeat?: string;
  stitches?: number;
  quantity?: number;
  deadline?: string;
  remarks?: string;
}

/**
 * What a status change stamps.
 *
 * Only a real change is an event — the edit form sends the status on every
 * save, and re-stamping would move "approved on the 3rd" to today. Reopening a
 * sample (back to in progress) clears the answer, because it no longer stands.
 */
const statusStamps = (
  status: SampleStatus | undefined,
  existing?: ISample
): Partial<Pick<ISample, "decidedAt">> => {
  if (!status || status === existing?.status) return {};

  if (status === SAMPLE_STATUS.APPROVED || status === SAMPLE_STATUS.REJECTED) {
    return { decidedAt: new Date() };
  }

  if (status === SAMPLE_STATUS.IN_PROGRESS) return { decidedAt: undefined };
  return {};
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
    const sampleNumber = await jobNumbers.next(company.name);
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

  /*
   * A converted sample's status follows its order. Letting it be set by hand
   * would put it back in the Sampling list — and back in the New order picker
   * — while its order is still on the floor.
   */
  if (sample.status === SAMPLE_STATUS.IN_PRODUCTION && patch.status !== undefined) {
    throw new ApiError(
      409,
      `Sample ${sample.sampleNumber} is in production as an order. Delete the order to return it to sampling.`
    );
  }

  if (patch.companyId && String(patch.companyId) !== String(sample.company)) {
    // Its order is that buyer's order; moving the sample would split them.
    const linked = await ProductionOrder.countDocuments({ sample: sample._id }).exec();
    if (linked > 0) {
      throw new ApiError(409, "This sample has been converted into an order, so its buyer cannot change.");
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
 * Refused while an order points at it, for the same reason a company with
 * orders cannot be deleted: that order is the record of work done.
 */
export const deleteSample = async (id: string): Promise<void> => {
  const sample = await Sample.findById(id).exec();
  if (!sample) throw new ApiError(404, "That sample no longer exists");

  const linked = await ProductionOrder.countDocuments({ sample: sample._id }).exec();
  if (linked > 0) {
    throw new ApiError(
      409,
      `Sample ${sample.sampleNumber} is in production as an order. Delete the order first.`
    );
  }

  await sample.deleteOne();
  if (sample.designImage?.publicId) await destroyImage(sample.designImage.publicId);
};

/** Samples by status, across every buyer — for the statistics tab. */
export const sampleCounts = async (): Promise<Record<string, number>> => {
  const [byStatus, overdue] = await Promise.all([
    Sample.aggregate<{ _id: SampleStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
    Sample.countDocuments(overdueFilter()).exec(),
  ]);

  const counts: Record<string, number> = { OVERDUE: overdue, TOTAL: 0, OPEN: 0, SAMPLING: 0 };
  for (const row of byStatus) {
    counts[row._id] = row.count;
    counts.TOTAL! += row.count;
    if (OPEN_SAMPLE_STATUSES.includes(row._id)) counts.OPEN! += row.count;
    if (SAMPLING_STATUSES.includes(row._id)) counts.SAMPLING! += row.count;
  }

  return counts;
};
