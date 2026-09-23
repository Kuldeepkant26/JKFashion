import type { FilterQuery, Types } from "mongoose";
import {
  StockItem,
  CATEGORY_CONFIG,
  STOCK_CATEGORIES,
  type IStockItem,
  type StockCategory,
} from "../models/stockItem.model.js";
import {
  StockMovement,
  MOVEMENT_DIRECTION,
  balanceDelta,
  roundQuantity,
  type IStockMovement,
  type MovementDirection,
} from "../models/stockMovement.model.js";
import { Expense, type IExpense } from "../models/expense.model.js";
import { ApiError } from "../utils/ApiError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { startOfDayUTC, endOfDayUTC } from "../utils/productionDate.js";

export interface Actor {
  _id: Types.ObjectId;
  name: string;
}

/* -------------------------------------------------------------------- items */

export interface ListItemsOptions {
  category?: StockCategory;
  search?: string;
  includeArchived?: boolean;
}

export const listItems = async ({
  category,
  search,
  includeArchived = false,
}: ListItemsOptions = {}): Promise<IStockItem[]> => {
  const filter: FilterQuery<IStockItem> = {};

  if (category) filter.category = category;
  if (!includeArchived) filter.isArchived = false;
  if (search) filter.name = new RegExp(escapeRegex(search), "i");

  return StockItem.find(filter)
    .sort({ category: 1, name: 1 })
    .lean<IStockItem[]>()
    .exec();
};

export const getItem = async (id: string): Promise<IStockItem> => {
  const item = await StockItem.findById(id).exec();
  if (!item) throw new ApiError(404, "That item no longer exists");
  return item;
};

/**
 * Create the categories' default items if nothing exists yet.
 *
 * Called on the first list rather than from a migration, so a fresh install
 * opens on a usable screen instead of six empty tabs. Idempotent: it only ever
 * inserts names that are missing.
 */
export const ensureDefaultItems = async (createdBy?: Types.ObjectId): Promise<void> => {
  const existing = await StockItem.find().select("category name").lean().exec();
  const seen = new Set(existing.map((i) => `${i.category}:${i.name}`));

  const missing = STOCK_CATEGORIES.flatMap((category) =>
    CATEGORY_CONFIG[category].defaultItems
      .filter((name) => !seen.has(`${category}:${name}`))
      .map((name) => ({
        category,
        name,
        unit: CATEGORY_CONFIG[category].unit,
        balance: 0,
        createdBy,
      }))
  );

  if (missing.length) await StockItem.insertMany(missing, { ordered: false });
};

export interface CreateItemInput {
  category: StockCategory;
  name: string;
  unit?: string;
}

export const createItem = async (
  input: CreateItemInput,
  createdBy: Types.ObjectId
): Promise<IStockItem> => {
  const config = CATEGORY_CONFIG[input.category];

  /*
   * A singleton category holds one pooled quantity, not named varieties —
   * "Bobbin" is the item. Letting a second one in would split a balance that
   * is meant to be read as a single figure.
   */
  if (config.isSingleton) {
    const count = await StockItem.countDocuments({ category: input.category }).exec();
    if (count > 0) {
      throw new ApiError(409, `${config.label} is a single pooled item and already exists.`);
    }
  }

  return StockItem.create({
    category: input.category,
    name: input.name,
    unit: input.unit || config.unit,
    balance: 0,
    createdBy,
  });
};

export interface UpdateItemPatch {
  name?: string;
  unit?: string;
}

/**
 * Rename an item, or change its unit.
 *
 * The ledger keeps each movement's own `itemName` snapshot, so past rows go on
 * saying what they said — a rename is not a rewrite of history.
 */
export const updateItem = async (id: string, patch: UpdateItemPatch): Promise<IStockItem> => {
  const item = await getItem(id);

  if (patch.name !== undefined && CATEGORY_CONFIG[item.category].isSingleton) {
    throw new ApiError(409, "This item's name is fixed by its category.");
  }

  Object.assign(item, patch);
  await item.save();
  return item;
};

/**
 * Retire an item.
 *
 * Deleted outright only while it has no history; once movements exist it is
 * archived instead, because those rows are the record of material that really
 * came and went.
 */
export const archiveItem = async (id: string): Promise<{ deleted: boolean }> => {
  const item = await getItem(id);
  const movements = await StockMovement.countDocuments({ item: item._id }).exec();

  if (movements === 0) {
    await item.deleteOne();
    return { deleted: true };
  }

  item.isArchived = true;
  await item.save();
  return { deleted: false };
};

/** Restore an archived item to the working list. */
export const restoreItem = async (id: string): Promise<IStockItem> => {
  const item = await getItem(id);
  item.isArchived = false;
  await item.save();
  return item;
};

/* ---------------------------------------------------------------- movements */

export interface RecordMovementInput {
  direction: MovementDirection;
  quantity: number;
  date?: string;
  challanNo?: string;
  partyName?: string;
  note?: string;
}

/**
 * Write a balance back rounded, if the atomic $inc left float residue.
 *
 * Cheap: the extra write only happens when the value actually differs.
 */
const settleBalance = async (item: IStockItem): Promise<IStockItem> => {
  const rounded = roundQuantity(item.balance);
  if (rounded === item.balance) return item;

  return (
    (await StockItem.findByIdAndUpdate(
      item._id,
      { $set: { balance: rounded } },
      { new: true }
    ).exec()) ?? item
  );
};

export interface MovementResult {
  movement: IStockMovement;
  item: IStockItem;
  /** Set when the movement leaves the item short; shown to the operator. */
  warning?: string;
}

/**
 * Record one movement and move the balance with it.
 *
 * The balance is updated by an atomic `$inc` in the same breath as the insert,
 * not by reading the item, adding, and writing it back: two people recording
 * against one item at the same moment is the ordinary case on a floor, and a
 * read-modify-write silently loses one of them.
 *
 * A movement that takes the balance negative is still written. Refusing it
 * would mean the stock figure stayed plausible while the material was actually
 * gone, and whoever was holding the docket would simply stop recording. The
 * item is flagged instead, so the discrepancy is visible and gets reconciled.
 */
export const recordMovement = async (
  itemId: string,
  input: RecordMovementInput,
  actor: Actor
): Promise<MovementResult> => {
  const item = await getItem(itemId);
  const config = CATEGORY_CONFIG[item.category];

  if (!(input.quantity > 0)) {
    throw new ApiError(422, "Enter a quantity greater than zero");
  }

  if (input.direction === MOVEMENT_DIRECTION.BREAK && !config.allowsBreak) {
    throw new ApiError(422, `Breakage is not tracked for ${config.label.toLowerCase()}.`);
  }

  if (input.direction === MOVEMENT_DIRECTION.CORRECTION) {
    throw new ApiError(422, "Use the stock correction action to adjust a balance.");
  }

  const quantity = roundQuantity(input.quantity);
  const delta = balanceDelta(input.direction, quantity);
  const projected = roundQuantity(item.balance + delta);
  const short = projected < 0;

  const movement = await StockMovement.create({
    item: item._id,
    category: item.category,
    itemName: item.name,
    direction: input.direction,
    quantity,
    unit: item.unit,
    date: startOfDayUTC(input.date),
    challanNo: input.challanNo ?? "",
    partyName: input.partyName ?? "",
    note: input.note ?? "",
    createdBy: actor._id,
    createdByName: actor.name,
  });

  const incremented = await StockItem.findByIdAndUpdate(
    item._id,
    {
      $inc: { balance: delta },
      // Only ever set here; cleared when someone records a counted balance.
      ...(short ? { $set: { needsCorrection: true } } : {}),
    },
    { new: true }
  ).exec();

  /*
   * Snap the result back to one decimal. The $inc is what makes the write
   * atomic, but repeated float addition inside Mongo still leaves residue, and
   * a balance reading -59.90000000000009 undermines confidence in every other
   * figure on the page.
   */
  const updated = await settleBalance(incremented!);

  return {
    movement,
    item: updated,
    warning: short
      ? `${item.name} is now ${updated.balance} ${item.unit}. The opening figure is ` +
        `probably wrong — set a corrected stock figure when you can.`
      : undefined,
  };
};

/**
 * Undo a movement by writing its mirror image.
 *
 * Nothing is deleted: the original stays, marked reversed, next to the row that
 * cancels it. Someone reading the ledger afterwards can see that a figure was
 * entered and withdrawn, which is the fact — a vanished row is not.
 */
export const reverseMovement = async (
  movementId: string,
  actor: Actor,
  note?: string
): Promise<MovementResult> => {
  const original = await StockMovement.findById(movementId).exec();
  if (!original) throw new ApiError(404, "That entry no longer exists");

  if (original.isReversed) {
    throw new ApiError(409, "That entry has already been reversed.");
  }
  if (original.reversalOf) {
    throw new ApiError(409, "A reversal cannot itself be reversed.");
  }

  const item = await getItem(String(original.item));
  const delta = roundQuantity(-balanceDelta(original.direction, original.quantity));

  const reversal = await StockMovement.create({
    item: original.item,
    category: original.category,
    itemName: original.itemName,
    /*
     * The reversal carries the OPPOSITE direction with a positive quantity, so
     * it reads as a real movement ("50 kg back in") rather than as a negative
     * issue, which is how the floor would describe it.
     */
    direction:
      original.direction === MOVEMENT_DIRECTION.IN
        ? MOVEMENT_DIRECTION.OUT
        : MOVEMENT_DIRECTION.IN,
    quantity: original.quantity,
    unit: original.unit,
    date: original.date,
    challanNo: original.challanNo,
    partyName: original.partyName,
    note: note ?? `Reversal of ${original.direction} ${original.quantity} ${original.unit}`,
    reversalOf: original._id,
    createdBy: actor._id,
    createdByName: actor.name,
  });

  original.isReversed = true;
  await original.save();

  const incremented = await StockItem.findByIdAndUpdate(
    item._id,
    { $inc: { balance: delta } },
    { new: true }
  ).exec();

  return { movement: reversal, item: await settleBalance(incremented!) };
};

/**
 * Change a recorded movement.
 *
 * Compiled down to a reversal plus a fresh entry, so the ledger shows what was
 * first written, that it was withdrawn, and what replaced it — rather than
 * quietly presenting the new figure as though it had always been there.
 */
export const editMovement = async (
  movementId: string,
  patch: RecordMovementInput,
  actor: Actor
): Promise<MovementResult> => {
  const original = await StockMovement.findById(movementId).exec();
  if (!original) throw new ApiError(404, "That entry no longer exists");

  await reverseMovement(movementId, actor, "Replaced by a corrected entry");

  return recordMovement(String(original.item), patch, actor);
};

export interface ListMovementsOptions {
  itemId?: string;
  category?: StockCategory;
  direction?: MovementDirection;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface MovementListResult {
  items: IStockMovement[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const listMovements = async ({
  itemId,
  category,
  direction,
  from,
  to,
  page = 1,
  limit = 20,
}: ListMovementsOptions = {}): Promise<MovementListResult> => {
  const filter: FilterQuery<IStockMovement> = {};

  if (itemId) filter.item = itemId as unknown as Types.ObjectId;
  if (category) filter.category = category;
  if (direction) filter.direction = direction;

  if (from || to) {
    filter.date = {
      ...(from ? { $gte: startOfDayUTC(from) } : {}),
      ...(to ? { $lt: endOfDayUTC(to) } : {}),
    };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    StockMovement.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IStockMovement[]>()
      .exec(),
    StockMovement.countDocuments(filter).exec(),
  ]);

  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
};

/**
 * Record a counted stock figure.
 *
 * The difference between what was counted and what the ledger believed is
 * written as a CORRECTION movement rather than applied silently, so a balance
 * typed by hand is as accountable as one built from dockets.
 */
export const setBalance = async (
  itemId: string,
  counted: number,
  actor: Actor,
  note?: string
): Promise<MovementResult> => {
  const item = await getItem(itemId);
  const target = roundQuantity(counted);
  const delta = roundQuantity(target - item.balance);

  const movement = await StockMovement.create({
    item: item._id,
    category: item.category,
    itemName: item.name,
    direction: MOVEMENT_DIRECTION.CORRECTION,
    quantity: delta,
    unit: item.unit,
    date: startOfDayUTC(),
    note: note ?? `Counted stock set to ${target} ${item.unit}`,
    createdBy: actor._id,
    createdByName: actor.name,
  });

  const incremented = await StockItem.findByIdAndUpdate(
    item._id,
    { $inc: { balance: delta }, $set: { needsCorrection: target < 0 } },
    { new: true }
  ).exec();

  return { movement, item: await settleBalance(incremented!) };
};

/**
 * Rebuild an item's balance from its ledger.
 *
 * The stored figure should never need this — it is only ever moved alongside
 * the movement that caused it — but a derived total that cannot be re-derived
 * is a total nobody can check.
 */
export const recalculateBalance = async (itemId: string): Promise<IStockItem> => {
  const item = await getItem(itemId);

  const rows = await StockMovement.find({ item: item._id })
    .select("direction quantity")
    .lean<Array<{ direction: MovementDirection; quantity: number }>>()
    .exec();

  const balance = roundQuantity(
    rows.reduce((sum, r) => sum + balanceDelta(r.direction, r.quantity), 0)
  );

  item.balance = balance;
  item.needsCorrection = balance < 0;
  await item.save();

  return item;
};

/* ----------------------------------------------------------------- expenses */

export interface ExpenseInput {
  date?: string;
  description: string;
  amountPaise: number;
}

export const listExpenses = async ({
  from,
  to,
  page = 1,
  limit = 50,
}: { from?: string; to?: string; page?: number; limit?: number } = {}) => {
  const filter: FilterQuery<IExpense> = {};

  if (from || to) {
    filter.date = {
      ...(from ? { $gte: startOfDayUTC(from) } : {}),
      ...(to ? { $lt: endOfDayUTC(to) } : {}),
    };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IExpense[]>()
      .exec(),
    Expense.countDocuments(filter).exec(),
  ]);

  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
};

export const createExpense = async (
  input: ExpenseInput,
  actor: Actor
): Promise<IExpense> =>
  Expense.create({
    date: startOfDayUTC(input.date),
    description: input.description,
    amountPaise: input.amountPaise,
    createdBy: actor._id,
    createdByName: actor.name,
  });

export const updateExpense = async (
  id: string,
  patch: Partial<ExpenseInput>
): Promise<IExpense> => {
  const expense = await Expense.findById(id).exec();
  if (!expense) throw new ApiError(404, "That expense no longer exists");

  if (patch.date !== undefined) expense.date = startOfDayUTC(patch.date);
  if (patch.description !== undefined) expense.description = patch.description;
  if (patch.amountPaise !== undefined) expense.amountPaise = patch.amountPaise;

  await expense.save();
  return expense;
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expense = await Expense.findByIdAndDelete(id).exec();
  if (!expense) throw new ApiError(404, "That expense no longer exists");
};

/** Month-to-date and all-time, in paise. */
export const expenseTotals = async (): Promise<{ month: number; allTime: number }> => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [month, allTime] = await Promise.all([
    Expense.aggregate<{ total: number }>([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amountPaise" } } },
    ]).exec(),
    Expense.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$amountPaise" } } },
    ]).exec(),
  ]);

  return { month: month[0]?.total ?? 0, allTime: allTime[0]?.total ?? 0 };
};

/* ------------------------------------------------------- report and summary */

/** Everything that happened on one day — the client's "Today's Report". */
export const dailyReport = async (date?: string) => {
  const start = startOfDayUTC(date);
  const end = endOfDayUTC(date);

  const [movements, expenses] = await Promise.all([
    StockMovement.find({ date: { $gte: start, $lt: end } })
      .sort({ category: 1, itemName: 1, createdAt: 1 })
      .lean<IStockMovement[]>()
      .exec(),
    Expense.find({ date: { $gte: start, $lt: end } })
      .sort({ createdAt: 1 })
      .lean<IExpense[]>()
      .exec(),
  ]);

  const expenseTotal = expenses.reduce((sum, e) => sum + e.amountPaise, 0);

  return { date: start, movements, expenses, expenseTotal };
};

/** The figures behind the overview strip. */
export const getSummary = async () => {
  const [items, totals, todayMovements] = await Promise.all([
    StockItem.find({ isArchived: false })
      .select("category name unit balance needsCorrection")
      .sort({ category: 1, name: 1 })
      .lean<IStockItem[]>()
      .exec(),
    expenseTotals(),
    StockMovement.countDocuments({
      date: { $gte: startOfDayUTC(), $lt: endOfDayUTC() },
    }).exec(),
  ]);

  return {
    items,
    itemCount: items.length,
    needsCorrection: items.filter((i) => i.needsCorrection),
    expenseMonth: totals.month,
    expenseAllTime: totals.allTime,
    todayMovements,
  };
};
