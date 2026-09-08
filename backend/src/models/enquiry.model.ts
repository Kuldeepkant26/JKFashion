import mongoose, { Schema, type Document, type Model } from "mongoose";

/** Where an enquiry is in the admin's workflow. */
export const ENQUIRY_STATUS = {
  NEW: "NEW",
  READ: "READ",
  ARCHIVED: "ARCHIVED",
} as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUS)[keyof typeof ENQUIRY_STATUS];

export const ENQUIRY_STATUSES: EnquiryStatus[] = Object.values(ENQUIRY_STATUS);

export interface IEnquiry extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const enquirySchema = new Schema<IEnquiry>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },

    /**
     * Stored lowercase so "Buyer@Example.com" and "buyer@example.com" are one
     * person in the admin list rather than two.
     */
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },

    phone: { type: String, trim: true, maxlength: 40 },
    company: { type: String, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },

    status: {
      type: String,
      enum: ENQUIRY_STATUSES,
      default: ENQUIRY_STATUS.NEW,
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * The admin list is always "newest first", optionally filtered by status.
 * A compound index covers both that sort and the filtered variant, so the
 * list stays fast once a few thousand enquiries have accumulated.
 */
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ createdAt: -1 });

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const Enquiry: Model<IEnquiry> =
  (mongoose.models.Enquiry as Model<IEnquiry>) ||
  mongoose.model<IEnquiry>("Enquiry", enquirySchema);
