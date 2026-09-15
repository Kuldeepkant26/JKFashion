import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { type IMediaRef } from "./processSection.model.js";

/**
 * Where an order is on the floor.
 *
 * Note what is NOT here: "delayed". Being late is derived from the deadline,
 * not chosen by anyone — see `isOverdue` on the service. Storing it would make
 * "paused because the yarn ran out" and "late" the same fact, when a paused
 * order can be on time and a running one can be weeks behind.
 */
export const ORDER_STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUSES: OrderStatus[] = Object.values(ORDER_STATUS);

/** The statuses that mean work is still outstanding. One source of truth. */
export const OPEN_ORDER_STATUSES: OrderStatus[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.RUNNING,
  ORDER_STATUS.PAUSED,
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

/**
 * One day's production against an order.
 *
 * Append-only, and the sole source of truth for how much has been made. A
 * correction is a new entry with negative metres and a note, so the history
 * shows what was corrected and by whom rather than silently changing.
 */
export interface IProductionLogEntry {
  _id: Types.ObjectId;
  date: Date;
  metres: number;
  note: string;
  loggedBy?: Types.ObjectId;
  loggedByName: string;
  createdAt: Date;
}

const productionLogEntrySchema = new Schema<IProductionLogEntry>({
  /** The production date, which is not always the date it was entered. */
  date: { type: Date, required: true },

  // Signed: a negative entry is how a mistyped figure gets corrected.
  metres: { type: Number, required: true },

  note: { type: String, trim: true, maxlength: 200, default: "" },

  loggedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },

  /**
   * Who logged it, snapshotted. The detail view must be able to say "Ravi
   * logged 40m" without a join, and it should still say so if that account is
   * later deleted.
   */
  loggedByName: { type: String, trim: true, maxlength: 80, default: "" },

  createdAt: { type: Date, default: Date.now },
});

export interface IProductionOrder extends Document {
  company: Types.ObjectId;
  companyName: string;
  orderNumber: string;
  designNumber: string;
  status: OrderStatus;
  designImage: IMediaRef;
  fabricType: string;
  fabricWidth: string;
  yarnType: string;
  yarnColor: string;
  orderedMetres: number;
  completedMetres: number;
  startDate?: Date;
  deadline?: Date;
  estCompletion?: Date;
  machine: string;
  operator: string;
  mendings: number;
  rejectedMetres: number;
  remarks: string;
  log: Types.DocumentArray<IProductionLogEntry>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productionOrderSchema = new Schema<IProductionOrder>(
  {
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },

    /**
     * The buyer's name at the time of writing, kept alongside the reference.
     *
     * This is what the list renders and what the search box matches, so a page
     * of orders costs one query with no join. The company service fans a rename
     * out across these; the reference stays authoritative for "whose order is
     * this".
     */
    companyName: { type: String, required: true, trim: true, maxlength: 160 },

    orderNumber: { type: String, required: true, trim: true, maxlength: 60 },
    designNumber: { type: String, required: true, trim: true, maxlength: 60 },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: ORDER_STATUS.PENDING,
      index: true,
    },

    designImage: { type: mediaRefSchema, default: () => ({}) },

    fabricType: { type: String, trim: true, maxlength: 80, default: "" },

    /** Text, not a number: the floor writes "44 inch" and `60"`. */
    fabricWidth: { type: String, trim: true, maxlength: 40, default: "" },

    yarnType: { type: String, trim: true, maxlength: 80, default: "" },
    yarnColor: { type: String, trim: true, maxlength: 60, default: "" },

    orderedMetres: { type: Number, required: true, min: 0 },

    /**
     * Derived from `log`, never accepted from a client.
     *
     * Stored rather than summed on read because the list sorts and filters on
     * progress; adding up a subdocument array for every row of every page would
     * not survive the collection growing.
     */
    completedMetres: { type: Number, default: 0, min: 0 },

    startDate: { type: Date },
    deadline: { type: Date },
    estCompletion: { type: Date },

    machine: { type: String, trim: true, maxlength: 80, default: "" },

    /** Free text — the machine operator is floor staff, not a panel account. */
    operator: { type: String, trim: true, maxlength: 120, default: "" },

    mendings: { type: Number, default: 0, min: 0 },
    rejectedMetres: { type: Number, default: 0, min: 0 },

    remarks: { type: String, trim: true, maxlength: 2000, default: "" },

    log: { type: [productionLogEntrySchema], default: [] },

    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

/** The list: newest first, optionally filtered by the status pills. */
productionOrderSchema.index({ status: 1, createdAt: -1 });

/** The overdue filter: open orders whose deadline has passed. */
productionOrderSchema.index({ deadline: 1, status: 1 });

/** A company's own orders, and the guard that blocks deleting a buyer in use. */
productionOrderSchema.index({ company: 1, createdAt: -1 });

/** "Today's production" unwinds the log by date. */
productionOrderSchema.index({ "log.date": -1 });

productionOrderSchema.index({ createdAt: -1 });

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const ProductionOrder: Model<IProductionOrder> =
  (mongoose.models.ProductionOrder as Model<IProductionOrder>) ||
  mongoose.model<IProductionOrder>("ProductionOrder", productionOrderSchema);
