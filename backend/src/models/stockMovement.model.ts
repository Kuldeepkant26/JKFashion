import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { STOCK_CATEGORIES, type StockCategory } from "./stockItem.model.js";

/**
 * Which way stock moved.
 *
 * IN is a receipt, OUT an issue, BREAK stock destroyed in use, and CORRECTION
 * the adjustment written when someone sets a counted balance. Keeping
 * CORRECTION as a direction rather than editing the balance quietly means the
 * ledger explains every figure it shows, including the ones typed by hand.
 */
export const MOVEMENT_DIRECTION = {
  IN: "IN",
  OUT: "OUT",
  BREAK: "BREAK",
  CORRECTION: "CORRECTION",
} as const;

export type MovementDirection =
  (typeof MOVEMENT_DIRECTION)[keyof typeof MOVEMENT_DIRECTION];

export const MOVEMENT_DIRECTIONS: MovementDirection[] = Object.values(MOVEMENT_DIRECTION);

/** The directions an operator may record directly. */
export const ENTRY_DIRECTIONS: MovementDirection[] = [
  MOVEMENT_DIRECTION.IN,
  MOVEMENT_DIRECTION.OUT,
  MOVEMENT_DIRECTION.BREAK,
];

/**
 * Quantities are held to one decimal place.
 *
 * Stock is weighed and measured, not counted to atoms — a tenth of a kilo is
 * the finest the floor works in. Rounding here stops binary-float residue
 * accumulating through a long run of $inc operations and turning a balance of
 * -59.9 into -59.90000000000009 in the database.
 */
export const roundQuantity = (n: number): number => Math.round(n * 10) / 10;

/**
 * How a movement changes the balance, in one place.
 *
 * `quantity` is always positive and the direction carries the sign, so there is
 * no way to record "minus fifty in". CORRECTION is the exception: it is signed,
 * because an adjustment can go either way.
 */
export const balanceDelta = (direction: MovementDirection, quantity: number): number => {
  if (direction === MOVEMENT_DIRECTION.CORRECTION) return roundQuantity(quantity);
  return roundQuantity(direction === MOVEMENT_DIRECTION.IN ? quantity : -quantity);
};

export interface IStockMovement extends Document {
  item: Types.ObjectId;
  category: StockCategory;
  itemName: string;
  direction: MovementDirection;
  quantity: number;
  unit: string;
  date: Date;
  challanNo: string;
  partyName: string;
  note: string;
  reversalOf?: Types.ObjectId;
  isReversed: boolean;
  createdBy?: Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One movement of stock. Append-only.
 *
 * Nothing here is ever edited or deleted. A mistake is corrected by writing
 * the mirror-image movement, which leaves both the error and its correction in
 * the history with a name against each — the same decision the production log
 * makes, and for the same reason: the ledger is the record of what happened,
 * not of what someone last typed.
 */
const stockMovementSchema = new Schema<IStockMovement>(
  {
    item: { type: Schema.Types.ObjectId, ref: "StockItem", required: true, index: true },

    /** Denormalised so the daily report can filter by category without a join. */
    category: { type: String, enum: STOCK_CATEGORIES, required: true },

    /**
     * The item's name when this was written. Renaming an item must not rewrite
     * what its old dockets said — the reference stays authoritative for "which
     * item is this".
     */
    itemName: { type: String, required: true, trim: true, maxlength: 120 },

    direction: { type: String, enum: MOVEMENT_DIRECTIONS, required: true },

    /**
     * Always positive for IN/OUT/BREAK; signed only for CORRECTION. The
     * direction is what makes a movement add or subtract.
     */
    quantity: { type: Number, required: true },

    /** Snapshot, so a row reads correctly if the item's unit is later changed. */
    unit: { type: String, trim: true, maxlength: 20, default: "" },

    /**
     * The day this happened, normalised to midnight UTC — stock movements are
     * facts about a date, not a moment. See utils/productionDate.
     */
    date: { type: Date, required: true, index: true },

    /** The delivery note this came in or went out on. Free text: they vary. */
    challanNo: { type: String, trim: true, maxlength: 60, default: "" },

    partyName: { type: String, trim: true, maxlength: 160, default: "" },

    note: { type: String, trim: true, maxlength: 400, default: "" },

    /** Set when this movement exists to undo another one. */
    reversalOf: { type: Schema.Types.ObjectId, ref: "StockMovement", default: null },

    /** Set on the original when a reversal is written against it. */
    isReversed: { type: Boolean, default: false },

    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },

    /**
     * Who recorded it, snapshotted. The ledger must still say "Ravi recorded
     * this" if that account is later removed.
     */
    createdByName: { type: String, trim: true, maxlength: 80, default: "" },
  },
  { timestamps: true }
);

/** An item's own ledger, newest first. */
stockMovementSchema.index({ item: 1, date: -1, createdAt: -1 });

/** The daily report: everything that moved on one date. */
stockMovementSchema.index({ date: -1, category: 1 });

stockMovementSchema.index({ createdAt: -1 });

export const StockMovement: Model<IStockMovement> =
  (mongoose.models.StockMovement as Model<IStockMovement>) ||
  mongoose.model<IStockMovement>("StockMovement", stockMovementSchema);
