/**
 * Fills the inventory ledger with realistic test data.
 *
 *   npm run seed:stock            — does nothing if movements already exist
 *   npm run seed:stock -- --force — clears the ledger and re-seeds
 *
 * Unlike the orders seed there is no tag to match on, because every row here is
 * either an item (which the app creates by default anyway) or a movement
 * against one. --force therefore clears movements and expenses outright and
 * resets balances, and says so before it does.
 */
import mongoose from "mongoose";
import { validateEnv } from "../config/env.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { ROLES } from "../config/constants.js";
import { AdminUser } from "../models/adminUser.model.js";
import {
  StockItem,
  CATEGORY_CONFIG,
  STOCK_CATEGORIES,
  type StockCategory,
} from "../models/stockItem.model.js";
import {
  StockMovement,
  MOVEMENT_DIRECTION,
  balanceDelta,
  roundQuantity,
  type MovementDirection,
} from "../models/stockMovement.model.js";
import { Expense } from "../models/expense.model.js";
import { startOfDayUTC } from "../utils/productionDate.js";

const DAY = 24 * 60 * 60 * 1000;

const daysAgo = (n: number): Date => startOfDayUTC(new Date(Date.now() - n * DAY));

/** Deterministic, so a rebuilt test database has the same figures as before. */
let seed = 20260923;
const rand = (): number => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)] as T;
const between = (min: number, max: number): number =>
  Math.round((min + rand() * (max - min)) * 10) / 10;

const SUPPLIERS = [
  "Tirupati Yarns",
  "Nahar Spinning",
  "Shree Traders",
  "Balaji Agency",
  "Arihant Suppliers",
  "Kohinoor Mills",
];

const BUYERS = ["Nahar", "Meera Exports", "Dexter", "Floor — machine 2", "Floor — machine 5"];

const NOTES = ["", "", "", "machine 3", "urgent lot", "quality checked", "partial delivery"];

const EXPENSES = [
  ["Transport — Surat to Ahmedabad", 350000],
  ["Dyeing job work", 1250000],
  ["Machine servicing", 480000],
  ["Electricity bill", 2340000],
  ["Needle replacement stock", 165000],
  ["Courier and documentation", 42000],
  ["Generator diesel", 580000],
  ["Packing material", 275000],
  ["Labour overtime", 920000],
  ["Workshop repairs", 610000],
];

const run = async (): Promise<void> => {
  validateEnv();
  await connectDB();

  const force = process.argv.includes("--force");
  const existing = await StockMovement.countDocuments().exec();

  if (existing > 0 && !force) {
    logger.info(
      `${existing} stock movements already exist — nothing seeded. Re-run with --force to replace them.`
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  if (force && existing > 0) {
    const movements = await StockMovement.deleteMany({}).exec();
    const expenses = await Expense.deleteMany({}).exec();
    await StockItem.updateMany({}, { $set: { balance: 0, needsCorrection: false } }).exec();
    logger.info(
      `Cleared ${movements.deletedCount ?? 0} movements and ${expenses.deletedCount ?? 0} expenses`
    );
  }

  const owner = await AdminUser.findOne({ role: ROLES.MAIN_ADMIN }).select("_id name").exec();
  if (!owner) {
    logger.error("No admin found. Run `npm run seed` first.");
    await mongoose.connection.close();
    process.exit(1);
  }

  /* The categories' default items, so every tab has something in it. */
  for (const category of STOCK_CATEGORIES) {
    const config = CATEGORY_CONFIG[category];
    for (const name of config.defaultItems) {
      await StockItem.updateOne(
        { category, name },
        { $setOnInsert: { category, name, unit: config.unit, balance: 0, createdBy: owner._id } },
        { upsert: true }
      ).exec();
    }
  }

  /* A couple of extras under Other, which ships empty. */
  for (const name of ["Packing Boxes", "Machine Oil"]) {
    await StockItem.updateOne(
      { category: "OTHER" as StockCategory, name },
      {
        $setOnInsert: {
          category: "OTHER",
          name,
          unit: "pcs",
          balance: 0,
          createdBy: owner._id,
        },
      },
      { upsert: true }
    ).exec();
  }

  const items = await StockItem.find().exec();
  logger.info(`${items.length} items in place`);

  let movementCount = 0;
  const balances = new Map<string, number>();

  /** Write one movement and track what it does to the running balance. */
  const record = async (
    item: (typeof items)[number],
    direction: MovementDirection,
    quantity: number,
    date: Date,
    extra: { challanNo?: string; partyName?: string; note?: string } = {}
  ) => {
    const doc = await StockMovement.create({
      item: item._id,
      category: item.category,
      itemName: item.name,
      direction,
      quantity: roundQuantity(quantity),
      unit: item.unit,
      date,
      challanNo: extra.challanNo ?? "",
      partyName: extra.partyName ?? "",
      note: extra.note ?? "",
      createdBy: owner._id,
      createdByName: owner.name,
    });

    const key = String(item._id);
    balances.set(key, roundQuantity((balances.get(key) ?? 0) + balanceDelta(direction, quantity)));
    movementCount += 1;
    return doc;
  };

  for (const item of items) {
    const config = CATEGORY_CONFIG[item.category];
    const big = item.unit === "kg" || item.unit === "meters";

    /* An opening receipt ~90 days back, then movement across the quarter. */
    await record(
      item,
      MOVEMENT_DIRECTION.IN,
      big ? between(400, 1200) : between(200, 800),
      daysAgo(90),
      { challanNo: String(1000 + Math.floor(rand() * 200)), partyName: pick(SUPPLIERS) }
    );

    const events = 6 + Math.floor(rand() * 8);

    for (let i = 0; i < events; i += 1) {
      const day = daysAgo(Math.floor(rand() * 88));
      const roll = rand();

      if (roll < 0.42) {
        await record(item, MOVEMENT_DIRECTION.IN, big ? between(50, 400) : between(40, 250), day, {
          challanNo: String(1000 + Math.floor(rand() * 400)),
          partyName: pick(SUPPLIERS),
          note: pick(NOTES),
        });
      } else if (roll < 0.9 || !config.allowsBreak) {
        await record(item, MOVEMENT_DIRECTION.OUT, big ? between(30, 250) : between(20, 150), day, {
          challanNo: String(2000 + Math.floor(rand() * 400)),
          partyName: pick(BUYERS),
          note: pick(NOTES),
        });
      } else {
        // Needles snap; the breakage rate is the point of tracking it.
        await record(item, MOVEMENT_DIRECTION.BREAK, between(1, 12), day, {
          note: pick(["machine 2", "machine 4", "during setting", ""]),
        });
      }
    }
  }

  /*
   * One reversed-and-replaced pair, so the correction trail has something to
   * show: a figure entered, withdrawn, and re-entered correctly.
   */
  const target = items.find((i) => i.unit === "kg");
  if (target) {
    const wrong = await record(target, MOVEMENT_DIRECTION.IN, 850, daysAgo(12), {
      challanNo: "1187",
      partyName: "Tirupati Yarns",
      note: "Typed from the wrong docket",
    });

    await record(target, MOVEMENT_DIRECTION.OUT, 850, daysAgo(12), {
      challanNo: "1187",
      partyName: "Tirupati Yarns",
      note: "Replaced by a corrected entry",
    });
    await StockMovement.updateOne({ _id: wrong._id }, { $set: { isReversed: true } }).exec();
    // The reversal has to point at what it undoes, or the UI cannot pair them.
    const reversal = await StockMovement.findOne({ item: target._id, quantity: 850, direction: "OUT" })
      .sort({ createdAt: -1 })
      .exec();
    if (reversal) {
      reversal.reversalOf = wrong._id as never;
      await reversal.save();
    }

    await record(target, MOVEMENT_DIRECTION.IN, 580, daysAgo(12), {
      challanNo: "1187",
      partyName: "Tirupati Yarns",
      note: "Corrected quantity",
    });
  }

  /* Two items deliberately left short, so the correction flow has a subject. */
  const shortCandidates = items.filter((i) => i.category === "YARN" || i.category === "FABRIC");
  for (const item of shortCandidates.slice(0, 2)) {
    const key = String(item._id);
    const current = balances.get(key) ?? 0;
    await record(item, MOVEMENT_DIRECTION.OUT, roundQuantity(current + between(20, 60)), daysAgo(3), {
      challanNo: String(2500 + Math.floor(rand() * 100)),
      partyName: pick(BUYERS),
      note: "Issued against an unrecorded receipt",
    });
  }

  /* Apply the computed balances — the same figures the ledger sums to. */
  for (const item of items) {
    const balance = roundQuantity(balances.get(String(item._id)) ?? 0);
    await StockItem.updateOne(
      { _id: item._id },
      { $set: { balance, needsCorrection: balance < 0 } }
    ).exec();
  }

  /* Expenses spread across three months, so the monthly total is not the lot. */
  let expenseCount = 0;
  for (let i = 0; i < EXPENSES.length; i += 1) {
    const [description, amountPaise] = EXPENSES[i] as [string, number];

    for (const offset of [Math.floor(rand() * 25), 30 + Math.floor(rand() * 28)]) {
      await Expense.create({
        date: daysAgo(offset),
        description,
        // Vary it a little, still a whole number of paise.
        amountPaise: Math.round(amountPaise * (0.8 + rand() * 0.4)),
        createdBy: owner._id,
        createdByName: owner.name,
      });
      expenseCount += 1;
    }
  }

  const short = await StockItem.countDocuments({ needsCorrection: true }).exec();

  logger.info(`Created ${movementCount} stock movements across ${items.length} items`);
  logger.info(`Created ${expenseCount} expenses`);
  logger.info(`${short} items left needing a stock count, for testing the correction flow`);
  logger.info("Inventory ledger seeded.");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error: unknown) => {
  logger.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
