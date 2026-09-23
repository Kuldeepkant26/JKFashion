import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/**
 * What the floor keeps stock of.
 *
 * The categories are fixed in code because they are the shape of the business,
 * not data someone edits on a Tuesday: each carries its own unit and its own
 * rules (only needles break; bobbins and borers are a single pooled quantity
 * rather than named varieties). The ITEMS inside a category are data — a new
 * yarn count or fabric width is added in the panel.
 */
export const STOCK_CATEGORY = {
  BOBBIN: "BOBBIN",
  BORER: "BORER",
  YARN: "YARN",
  FABRIC: "FABRIC",
  NEEDLE: "NEEDLE",
  OTHER: "OTHER",
} as const;

export type StockCategory = (typeof STOCK_CATEGORY)[keyof typeof STOCK_CATEGORY];

export const STOCK_CATEGORIES: StockCategory[] = Object.values(STOCK_CATEGORY);

export interface CategoryConfig {
  label: string;
  unit: string;
  /**
   * Whether a BREAK movement is meaningful here. Needles snap in use, which is
   * neither a receipt nor an issue — it is stock destroyed, and the client
   * tracks it separately because the breakage rate is the thing being watched.
   */
  allowsBreak: boolean;
  /**
   * A category holding exactly one pooled item rather than named varieties.
   * Its item is created on demand and cannot be added to or renamed.
   */
  isSingleton: boolean;
  /** Seeded on first use so the section is never an empty screen. */
  defaultItems: string[];
}

export const CATEGORY_CONFIG: Record<StockCategory, CategoryConfig> = {
  BOBBIN: {
    label: "Bobbin",
    unit: "pcs",
    allowsBreak: false,
    isSingleton: true,
    defaultItems: ["Bobbin"],
  },
  BORER: {
    label: "Borer",
    unit: "pcs",
    allowsBreak: false,
    isSingleton: true,
    defaultItems: ["Borer"],
  },
  YARN: {
    label: "Yarn",
    unit: "kg",
    allowsBreak: false,
    isSingleton: false,
    defaultItems: ["2/30 Yarn", "2/40 Yarn", "Dyed Yarn", "Other Yarn"],
  },
  FABRIC: {
    label: "Fabric",
    unit: "meters",
    allowsBreak: false,
    isSingleton: false,
    defaultItems: ['63" Big Width', '48" Small Width'],
  },
  NEEDLE: {
    label: "Needle",
    unit: "pcs",
    allowsBreak: true,
    isSingleton: false,
    defaultItems: ["Needle"],
  },
  OTHER: {
    label: "Other Items",
    unit: "pcs",
    allowsBreak: false,
    isSingleton: false,
    defaultItems: [],
  },
};

export interface IStockItem extends Document {
  category: StockCategory;
  name: string;
  unit: string;
  balance: number;
  needsCorrection: boolean;
  isArchived: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockItemSchema = new Schema<IStockItem>(
  {
    category: { type: String, enum: STOCK_CATEGORIES, required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 120 },

    /** Copied from the category on create, but overridable per item. */
    unit: { type: String, required: true, trim: true, maxlength: 20 },

    /**
     * What is on the floor right now.
     *
     * Stored rather than summed from the ledger on every read: the overview
     * lists every item at once, and a per-row aggregation over a movement
     * collection would not survive that collection growing. It is kept honest
     * by being written only through an atomic $inc alongside the movement that
     * caused it, and `recalculateBalance` can rebuild it from the rows at any
     * time.
     *
     * Deliberately NOT clamped at zero. A stock figure that silently refuses
     * to go negative hides the discrepancy it should be reporting — see
     * `needsCorrection`.
     */
    balance: { type: Number, default: 0 },

    /**
     * Set when the balance goes negative, which means the opening figure or
     * some earlier movement was wrong. Surfaced in the UI as a prompt to
     * reconcile, and cleared when someone sets a corrected balance.
     */
    needsCorrection: { type: Boolean, default: false },

    /**
     * Retired rather than deleted. An item with movements against it is part
     * of the record; removing it would orphan its history.
     */
    isArchived: { type: Boolean, default: false, index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

/*
 * One name per category. Two "2/40 Yarn" rows would make every movement
 * against them a guess. The duplicate-key error is already translated to a
 * readable 409 by the error handler, so this needs no check in the service.
 */
stockItemSchema.index({ category: 1, name: 1 }, { unique: true });

/** The overview reads every live item, grouped by category. */
stockItemSchema.index({ isArchived: 1, category: 1, name: 1 });

export const StockItem: Model<IStockItem> =
  (mongoose.models.StockItem as Model<IStockItem>) ||
  mongoose.model<IStockItem>("StockItem", stockItemSchema);
