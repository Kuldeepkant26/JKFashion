import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { type IMediaRef } from "./processSection.model.js";

/**
 * Where a sample is.
 *
 * A sample is its own record, not a status on a production order: sampling
 * work is done and judged before any quantity is committed, and mixing the two
 * made the order list report samples as production.
 *
 * Made, then DELIVERED — handed to the buyer and waiting on their answer —
 * then APPROVED or REJECTED. Delivering is optional: a sample the buyer judged
 * on the spot can go straight from in progress to their answer.
 *
 * A sample becomes a production order one to one. Converting moves the
 * sample to IN_PRODUCTION, which takes it out of the Sampling list and into
 * its "In production" tab; the order points back at it through `sample` on
 * the productionOrder model. Deleting that order returns the sample to
 * APPROVED. (An order can also be created directly, with no sample at all.)
 *
 * Declaration order is the lifecycle order; the filter pills map over it.
 */
export const SAMPLE_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  DELIVERED: "DELIVERED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  IN_PRODUCTION: "IN_PRODUCTION",
} as const;

export type SampleStatus = (typeof SAMPLE_STATUS)[keyof typeof SAMPLE_STATUS];

export const SAMPLE_STATUSES: SampleStatus[] = Object.values(SAMPLE_STATUS);

/**
 * Still in sampling: what the Sampling list shows under "All", and the only
 * statuses a person may set. IN_PRODUCTION is reached one way — converting the
 * sample into an order — and left one way, deleting that order.
 */
export const SAMPLING_STATUSES: SampleStatus[] = [
  SAMPLE_STATUS.IN_PROGRESS,
  SAMPLE_STATUS.DELIVERED,
  SAMPLE_STATUS.APPROVED,
  SAMPLE_STATUS.REJECTED,
];

/**
 * Open: not yet converted, and not turned down. These are what "samples open"
 * counts, and the samples a new production order may be converted from.
 */
export const OPEN_SAMPLE_STATUSES: SampleStatus[] = [
  SAMPLE_STATUS.IN_PROGRESS,
  SAMPLE_STATUS.DELIVERED,
  SAMPLE_STATUS.APPROVED,
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
  repeat?: string;
  stitches?: number;
  quantity: string;
  deadline?: Date;
  deliveredAt?: Date;
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

    /**
     * The design's repeat as the floor writes it — "8/4", quarters of a Swiss
     * inch (see utils/repeat). Carried onto its order.
     */
    repeat: { type: String, trim: true, maxlength: 20 },

    /** Stitch count for one repeat of the design. Carried onto its orders. */
    stitches: { type: Number, min: 0 },

    /**
     * What was made for the sample, in the floor's own words — "10m",
     * "2 pcs", "1 panel + swatch". Free text: samples come in metres, pieces
     * or panels, and nothing adds these up. It was metres-only once; the
     * migrate:samples script turns those old numbers into "10m".
     */
    quantity: { type: String, trim: true, maxlength: 100, default: "" },

    deadline: { type: Date },

    /**
     * When the sample was handed to the buyer, stamped by the service when the
     * status moves to DELIVERED. It stays through the buyer's answer and into
     * production — it is when the sample reached them — and is cleared only
     * if the sample is reopened to be made again.
     */
    deliveredAt: { type: Date },

    /**
     * When the buyer's answer was recorded — approved or rejected — stamped by
     * the service when the status moves, so the company history can say when
     * without a separate audit collection. A sample converted into an order
     * without first being marked approved is stamped at conversion: taking
     * the order is the approval.
     */
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
