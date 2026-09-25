import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { type IMediaRef } from "./processSection.model.js";

/**
 * Where a sample is with the buyer.
 *
 * A sample is its own record, not a status on a production order: sampling
 * work is done, sent and judged before any quantity is committed, and mixing
 * the two made the order list report samples as production. A production
 * order points back at the approved sample it came from — see `sample` on the
 * productionOrder model.
 *
 * Declaration order is the lifecycle order; the filter pills map over it.
 */
export const SAMPLE_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  SENT: "SENT",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type SampleStatus = (typeof SAMPLE_STATUS)[keyof typeof SAMPLE_STATUS];

export const SAMPLE_STATUSES: SampleStatus[] = Object.values(SAMPLE_STATUS);

/** Still waiting on the floor or on the buyer. */
export const OPEN_SAMPLE_STATUSES: SampleStatus[] = [
  SAMPLE_STATUS.IN_PROGRESS,
  SAMPLE_STATUS.SENT,
];

const mediaRefSchema = new Schema<IMediaRef>(
  {
    publicId: { type: String },
    url: { type: String },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

export interface ISample extends Document {
  company: Types.ObjectId;
  companyName: string;
  sampleNumber: string;
  designNumber: string;
  status: SampleStatus;
  designImage: IMediaRef;
  fabricType: string;
  fabricWidth: string;
  yarnType: string;
  yarnColor: string;
  repeat?: number;
  stitches?: number;
  quantity: number;
  deadline?: Date;
  sentAt?: Date;
  decidedAt?: Date;
  remarks: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sampleSchema = new Schema<ISample>(
  {
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },

    /** Snapshot for the list and search, kept in step by the company service. */
    companyName: { type: String, required: true, trim: true, maxlength: 160 },

    /** Server-generated from a per-buyer counter, like an order number. */
    sampleNumber: { type: String, required: true, trim: true, maxlength: 60 },
    designNumber: { type: String, required: true, trim: true, maxlength: 60 },

    status: {
      type: String,
      enum: SAMPLE_STATUSES,
      default: SAMPLE_STATUS.IN_PROGRESS,
      index: true,
    },

    designImage: { type: mediaRefSchema, default: () => ({}) },

    fabricType: { type: String, trim: true, maxlength: 80, default: "" },
    fabricWidth: { type: String, trim: true, maxlength: 40, default: "" },
    yarnType: { type: String, trim: true, maxlength: 80, default: "" },
    yarnColor: { type: String, trim: true, maxlength: 60, default: "" },

    /** Design repeat along the fabric, in inches. Carried onto its orders. */
    repeat: { type: Number, min: 0 },

    /** Stitch count for one repeat of the design. Carried onto its orders. */
    stitches: { type: Number, min: 0 },

    /** Metres made for the sample itself — usually a few, often zero. */
    quantity: { type: Number, default: 0, min: 0 },

    deadline: { type: Date },

    /**
     * Stamped by the service when the status moves, so the company history
     * can say when a sample went out and when the buyer answered without a
     * separate audit collection.
     */
    sentAt: { type: Date },
    decidedAt: { type: Date },

    remarks: { type: String, trim: true, maxlength: 2000, default: "" },

    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

sampleSchema.index({ sampleNumber: 1 });
sampleSchema.index({ status: 1, createdAt: -1 });
sampleSchema.index({ company: 1, createdAt: -1 });
sampleSchema.index({ createdAt: -1 });

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const Sample: Model<ISample> =
  (mongoose.models.Sample as Model<ISample>) || mongoose.model<ISample>("Sample", sampleSchema);
