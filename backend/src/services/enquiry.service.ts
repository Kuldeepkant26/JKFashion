import { Enquiry, ENQUIRY_STATUS, type EnquiryStatus, type IEnquiry } from "../models/enquiry.model.js";
import { ApiError } from "../utils/ApiError.js";

export interface NewEnquiry {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
}

export const createEnquiry = async (input: NewEnquiry): Promise<IEnquiry> =>
  Enquiry.create({ ...input, status: ENQUIRY_STATUS.NEW });

export interface ListOptions {
  status?: EnquiryStatus;
  page?: number;
  limit?: number;
}

export interface ListResult {
  items: IEnquiry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  newCount: number;
}

/**
 * Paginated, newest first.
 *
 * `newCount` is returned alongside the page because the admin needs the unread
 * badge regardless of which page or filter is being viewed — deriving it from
 * `items` would only ever count the current slice.
 */
export const listEnquiries = async ({
  status,
  page = 1,
  limit = 20,
}: ListOptions = {}): Promise<ListResult> => {
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [items, total, newCount] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<IEnquiry[]>().exec(),
    Enquiry.countDocuments(filter).exec(),
    Enquiry.countDocuments({ status: ENQUIRY_STATUS.NEW }).exec(),
  ]);

  return {
    items,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    newCount,
  };
};

export const updateStatus = async (id: string, status: EnquiryStatus): Promise<IEnquiry> => {
  const enquiry = await Enquiry.findByIdAndUpdate(id, { $set: { status } }, { new: true }).exec();
  if (!enquiry) throw new ApiError(404, "Enquiry not found");
  return enquiry;
};

export const deleteEnquiry = async (id: string): Promise<void> => {
  const result = await Enquiry.findByIdAndDelete(id).exec();
  if (!result) throw new ApiError(404, "Enquiry not found");
};
