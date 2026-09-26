/**
 * Fills the inventory section with realistic test data.
 *
 *   npm run seed:inventory            — does nothing if data already exists
 *   npm run seed:inventory -- --force — removes what this script wrote, re-seeds
 *
 * Every company it creates is tagged in `notes` with SEED_TAG, and --force only
 * ever deletes rows carrying that tag plus the orders belonging to them. A
 * blanket deleteMany would take real production data with it the first time
 * someone ran this against the wrong database.
 */
import mongoose from "mongoose";
import { validateEnv } from "../config/env.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { ROLES } from "../config/constants.js";
import { AdminUser } from "../models/adminUser.model.js";
import { Company } from "../models/company.model.js";
import { ProductionOrder, ORDER_STATUS } from "../models/productionOrder.model.js";
import { Counter } from "../models/counter.model.js";
import { Sample, SAMPLE_STATUS, type SampleStatus } from "../models/sample.model.js";
import { docketNumbering } from "../utils/docketNumber.js";
import { generateOrderNumber } from "../services/productionOrder.service.js";
import { startOfDayUTC } from "../utils/productionDate.js";

/** Written into each seeded company's address, and matched on --force. */
const SEED_TAG = "[seed]";

const DAY = 24 * 60 * 60 * 1000;

/** A date N days before today, at midnight UTC. */
const daysAgo = (n: number): Date => startOfDayUTC(new Date(Date.now() - n * DAY));

/**
 * Deterministic pseudo-randomness.
 *
 * Seeded so two runs produce the same figures: a test database that changes
 * shape every time it is rebuilt makes "is this number right?" unanswerable.
 */
let seed = 20260922;
const rand = (): number => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)] as T;
const between = (min: number, max: number): number =>
  Math.round((min + rand() * (max - min)) * 10) / 10;

const COMPANIES = [
  {
    name: "Dexter Exports",
    location: "Surat",
    gst: "24AADCD1234F1Z5",
    contacts: [
      { name: "Ramesh Shah", phone: "98765 43210", email: "ramesh@dexterexports.in" },
      { name: "Priya Mehta", phone: "99887 76655", email: "" },
    ],
  },
  {
    name: "Meera Fabrics",
    location: "Surat",
    gst: "24AAFCM5678K1Z2",
    contacts: [{ name: "Meera Patel", phone: "98240 11223", email: "meera@meerafabrics.in" }],
  },
  {
    name: "Krishna Textiles",
    location: "Ahmedabad",
    gst: "24AACCK9012L1Z8",
    // Only an email — exercises the "any one of the three" rule.
    contacts: [{ name: "", phone: "", email: "orders@krishnatextiles.co.in" }],
  },
  {
    name: "Anand Silk Mills",
    location: "Vadodara",
    gst: "24AAECA3456M1Z4",
    contacts: [
      { name: "Anand Desai", phone: "94270 55667", email: "anand@anandsilk.in" },
      { name: "Accounts", phone: "0265 2345678", email: "accounts@anandsilk.in" },
      { name: "Nikhil Joshi", phone: "97250 33445", email: "" },
    ],
  },
  {
    name: "Rajlaxmi Creation",
    location: "Surat",
    gst: "24AAGCR7890N1Z6",
    // Only a phone, and no name at all.
    contacts: [{ name: "", phone: "98795 66778", email: "" }],
  },
  {
    name: "Shreeji Weaves",
    location: "Rajkot",
    gst: "24AABCS2345P1Z1",
    contacts: [{ name: "Jayesh Bhatt", phone: "98252 44556", email: "jayesh@shreejiweaves.in" }],
  },
  {
    name: "Nakoda Synthetics",
    location: "Mumbai",
    gst: "27AAHCN6789Q1Z9",
    contacts: [
      { name: "Sunil Jain", phone: "98201 77889", email: "sunil@nakodasyn.com" },
      { name: "Dispatch desk", phone: "022 28765432", email: "" },
    ],
  },
  {
    name: "Vardhman Prints",
    location: "Ludhiana",
    gst: "03AAACV1234R1Z7",
    contacts: [{ name: "Harpreet Singh", phone: "98140 22334", email: "hs@vardhmanprints.in" }],
  },
  {
    name: "Ganpati Embroidery",
    location: "Surat",
    gst: "24AADCG5678S1Z3",
    contacts: [{ name: "Bhavesh Kotak", phone: "99099 88776", email: "" }],
  },
  {
    name: "Laxmi Narayan Trading",
    location: "Jaipur",
    gst: "08AAFCL9012T1Z5",
    contacts: [
      { name: "Mohit Agarwal", phone: "94140 66778", email: "mohit@lntrading.in" },
      { name: "Seema Agarwal", phone: "", email: "seema@lntrading.in" },
    ],
  },
  {
    name: "Sagar Fashion House",
    location: "Bengaluru",
    gst: "29AAGCS3456U1Z2",
    contacts: [{ name: "Sagar Rao", phone: "98450 11224", email: "sagar@sagarfashion.in" }],
  },
  {
    name: "Ashirwad Mills",
    location: "Indore",
    gst: "23AABCA7890V1Z8",
    contacts: [{ name: "Deepak Verma", phone: "94250 33447", email: "deepak@ashirwadmills.in" }],
  },
];

const FABRICS = ["Cambric", "Poplin", "Georgette", "Chiffon", "Satin", "Organza", "Crepe"];
const WIDTHS = ['44 inch', '58 inch', '60"', "1.5 m", '36 inch'];
const YARNS = ["Viscose rayon", "Polyester", "Cotton 40s", "Nylon", "Poly-viscose"];
const COLOURS = ["Ivory", "Midnight blue", "Rose gold", "Emerald", "Black", "Peach", "Wine"];
const MACHINES = ["M-01", "M-02", "M-03", "M-04", "M-05", "M-06"];
const OPERATORS = ["Ravi Kumar", "Sunita Devi", "Imran Shaikh", "Prakash Jha", "Lata More"];
const REMARKS = [
  "Buyer asked for a tighter selvedge.",
  "Second lot — match the shade of the first.",
  "Yarn arrived two days late, adjust the schedule.",
  "Sample approved over WhatsApp on the 12th.",
  "",
  "",
];

/**
 * The plan for each order: how old it is, where it sits, and how far along.
 *
 * Written out rather than randomised so every screen has something to show —
 * each status is populated, some orders are overdue, and the date filter has
 * orders spread across six months to actually filter.
 */
interface Plan {
  status: string;
  /** Days before today the order was raised. */
  age: number;
  /** Fraction of the ordered quantity already produced. */
  progress: number;
  /** Days from today the deadline falls; negative is in the past. */
  due: number;
}

/**
 * Samples still in sampling, one per company in turn: some being made (one of
 * them overdue), some approved and waiting to be converted into an order, one
 * rejected. The samples behind the orders below are created with the orders,
 * one each, already in production.
 */
const SAMPLE_PLANS: Array<{ status: SampleStatus; age: number; due: number }> = [
  { status: SAMPLE_STATUS.IN_PROGRESS, age: 2, due: 10 },
  { status: SAMPLE_STATUS.IN_PROGRESS, age: 5, due: 7 },
  { status: SAMPLE_STATUS.IN_PROGRESS, age: 20, due: -4 },
  { status: SAMPLE_STATUS.APPROVED, age: 8, due: -1 },
  { status: SAMPLE_STATUS.APPROVED, age: 12, due: -3 },
  { status: SAMPLE_STATUS.APPROVED, age: 15, due: -5 },
  { status: SAMPLE_STATUS.REJECTED, age: 30, due: -15 },
];

const PLANS: Plan[] = [
  // Pending — approved, not yet on a machine.
  { status: ORDER_STATUS.PENDING, age: 6, progress: 0, due: 25 },
  { status: ORDER_STATUS.PENDING, age: 11, progress: 0, due: 20 },
  { status: ORDER_STATUS.PENDING, age: 17, progress: 0, due: 18 },
  { status: ORDER_STATUS.PENDING, age: 24, progress: 0, due: 12 },
  { status: ORDER_STATUS.PENDING, age: 33, progress: 0, due: 9 },
  { status: ORDER_STATUS.PENDING, age: 61, progress: 0, due: -3 },

  // Running — the bulk of the board.
  { status: ORDER_STATUS.RUNNING, age: 12, progress: 0.15, due: 22 },
  { status: ORDER_STATUS.RUNNING, age: 19, progress: 0.35, due: 16 },
  { status: ORDER_STATUS.RUNNING, age: 26, progress: 0.5, due: 14 },
  { status: ORDER_STATUS.RUNNING, age: 31, progress: 0.62, due: 10 },
  { status: ORDER_STATUS.RUNNING, age: 38, progress: 0.7, due: 8 },
  { status: ORDER_STATUS.RUNNING, age: 44, progress: 0.8, due: 6 },
  { status: ORDER_STATUS.RUNNING, age: 52, progress: 0.45, due: 4 },
  { status: ORDER_STATUS.RUNNING, age: 58, progress: 0.9, due: 2 },
  { status: ORDER_STATUS.RUNNING, age: 67, progress: 0.55, due: -2 },
  { status: ORDER_STATUS.RUNNING, age: 74, progress: 0.72, due: -8 },
  { status: ORDER_STATUS.RUNNING, age: 83, progress: 0.4, due: -15 },

  // Paused — on hold, can be on time or late.
  { status: ORDER_STATUS.PAUSED, age: 29, progress: 0.3, due: 11 },
  { status: ORDER_STATUS.PAUSED, age: 41, progress: 0.25, due: 5 },
  { status: ORDER_STATUS.PAUSED, age: 70, progress: 0.6, due: -10 },
  { status: ORDER_STATUS.PAUSED, age: 96, progress: 0.18, due: -22 },

  // Completed — done, and never overdue whatever the deadline said.
  { status: ORDER_STATUS.COMPLETED, age: 55, progress: 1, due: -5 },
  { status: ORDER_STATUS.COMPLETED, age: 63, progress: 1, due: -12 },
  { status: ORDER_STATUS.COMPLETED, age: 78, progress: 1, due: -20 },
  { status: ORDER_STATUS.COMPLETED, age: 89, progress: 1, due: -30 },
  { status: ORDER_STATUS.COMPLETED, age: 104, progress: 1, due: -40 },
  { status: ORDER_STATUS.COMPLETED, age: 118, progress: 1, due: -52 },
  { status: ORDER_STATUS.COMPLETED, age: 131, progress: 1, due: -63 },
  { status: ORDER_STATUS.COMPLETED, age: 145, progress: 1, due: -75 },
  { status: ORDER_STATUS.COMPLETED, age: 158, progress: 1, due: -88 },
  { status: ORDER_STATUS.COMPLETED, age: 172, progress: 1, due: -101 },

  // Older running/pending work, so the six-month range has depth at the far end.
  { status: ORDER_STATUS.RUNNING, age: 137, progress: 0.85, due: -60 },
  { status: ORDER_STATUS.PENDING, age: 151, progress: 0, due: -70 },
  { status: ORDER_STATUS.PAUSED, age: 165, progress: 0.35, due: -84 },
];

/**
 * Turn a target progress into log entries spread across working days.
 *
 * Production is recorded as history, not as a total, so the seed writes the
 * history and lets the total follow from it — exactly as the app does. One
 * order gets a negative correction, because that path is otherwise untested.
 */
const buildLog = (
  ordered: number,
  progress: number,
  raisedAt: Date,
  loggedBy: mongoose.Types.ObjectId,
  loggedByName: string,
  withCorrection: boolean
): { entries: Record<string, unknown>[]; total: number } => {
  if (progress <= 0) return { entries: [], total: 0 };

  const target = Math.round(ordered * progress * 10) / 10;
  const days = Math.max(2, Math.min(9, Math.round(target / Math.max(1, ordered / 12))));
  const entries: Record<string, unknown>[] = [];
  let total = 0;

  for (let i = 0; i < days; i += 1) {
    const last = i === days - 1;
    // The final entry takes up the remainder, so the total lands exactly.
    const metres = last
      ? Math.round((target - total) * 10) / 10
      : Math.round((target / days) * between(0.7, 1.3) * 10) / 10;

    if (metres <= 0) continue;

    // Entries start the day after the order was raised and step forward.
    const date = startOfDayUTC(new Date(raisedAt.getTime() + (i + 1) * 2 * DAY));
    if (date.getTime() > Date.now()) break;

    entries.push({
      date,
      metres,
      note: last && progress >= 1 ? "Final lot, packed." : "",
      loggedBy,
      loggedByName,
      createdAt: date,
    });
    total = Math.round((total + metres) * 10) / 10;
  }

  if (withCorrection && entries.length >= 2) {
    const first = entries[0] as { date: Date; metres: number };
    const correction = -Math.min(12, Math.round(first.metres * 0.2 * 10) / 10);

    entries.splice(1, 0, {
      date: startOfDayUTC(new Date(first.date.getTime() + DAY)),
      metres: correction,
      note: "Correction — 20m was entered twice.",
      loggedBy,
      loggedByName,
      createdAt: startOfDayUTC(new Date(first.date.getTime() + DAY)),
    });
    total = Math.round((total + correction) * 10) / 10;
  }

  return { entries, total };
};

const run = async (): Promise<void> => {
  validateEnv();
  await connectDB();

  const force = process.argv.includes("--force");
  const existing = await Company.countDocuments().exec();

  if (existing > 0 && !force) {
    logger.info(
      `${existing} companies already exist — nothing seeded. Re-run with --force to replace the seeded ones.`
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  if (force) {
    // Only what this script wrote: matched on the tag, never a blanket wipe.
    const seeded = await Company.find({ address: new RegExp(escapeTag()) })
      .select("_id name")
      .lean()
      .exec();
    const ids = seeded.map((c) => c._id);

    if (ids.length) {
      const orders = await ProductionOrder.deleteMany({ company: { $in: ids } }).exec();
      await Sample.deleteMany({ company: { $in: ids } }).exec();
      await Company.deleteMany({ _id: { $in: ids } }).exec();
      // The counters go too, so numbering restarts with the data it counted.
      await Counter.deleteMany({ _id: /^(order|sample):/ }).exec();
      logger.info(
        `Removed ${ids.length} seeded companies and ${orders.deletedCount ?? 0} of their orders`
      );
    } else {
      logger.info("Nothing tagged as seeded was found — leaving existing data alone");
    }
  }

  /* The owner, so the production log has a real name against each entry. */
  const owner = await AdminUser.findOne({ role: ROLES.MAIN_ADMIN }).select("_id name").exec();
  if (!owner) {
    logger.error("No admin found. Run `npm run seed` first.");
    await mongoose.connection.close();
    process.exit(1);
  }

  const companies = await Company.insertMany(
    COMPANIES.map((c) => ({
      ...c,
      address: `${pick(["Ring Road", "GIDC Estate", "Textile Market", "Station Road"])}, ${c.location} ${SEED_TAG}`,
      createdBy: owner._id,
    }))
  );

  logger.info(`Created ${companies.length} companies`);

  const sampleNumbers = docketNumbering("sample", "SMP");

  /** One sample's worth of design, shared by a sample and the order it becomes. */
  const design = () => ({
    fabricType: pick(FABRICS),
    fabricWidth: pick(WIDTHS),
    yarnType: pick(YARNS),
    yarnColor: pick(COLOURS),
    repeat: pick([6.75, 13.5, 27]),
    stitches: Math.round(between(8000, 60000)),
  });

  for (let i = 0; i < SAMPLE_PLANS.length; i += 1) {
    const plan = SAMPLE_PLANS[i]!;
    const company = companies[i % companies.length]!;
    const raisedAt = daysAgo(plan.age);
    const answered = plan.status !== SAMPLE_STATUS.IN_PROGRESS;

    await Sample.create({
      company: company._id,
      companyName: company.name,
      sampleNumber: await sampleNumbers.next(company.name),
      designNumber: `D-${300 + i}`,
      status: plan.status,
      ...design(),
      quantity: Math.round(between(1, 5)),
      deadline: startOfDayUTC(new Date(Date.now() + plan.due * DAY)),
      decidedAt: answered ? new Date(raisedAt.getTime() + 6 * DAY) : undefined,
      remarks: "",
      createdBy: owner._id,
      updatedBy: owner._id,
      createdAt: raisedAt,
      updatedAt: raisedAt,
    });
  }

  logger.info(`Created ${SAMPLE_PLANS.length} samples still in sampling`);

  let orderCount = 0;
  let logCount = 0;

  for (let i = 0; i < PLANS.length; i += 1) {
    const plan = PLANS[i] as Plan;
    const company = companies[i % companies.length]!;
    const raisedAt = daysAgo(plan.age);
    const ordered = between(200, 4000);
    const designNumber = `D-${100 + i}`;
    const details = design();

    /*
     * Every order is converted from a sample, so each gets one: made a couple
     * of weeks before the order, approved just before it, now in production.
     */
    const sample = await Sample.create({
      company: company._id,
      companyName: company.name,
      sampleNumber: await sampleNumbers.next(company.name),
      designNumber,
      status: SAMPLE_STATUS.IN_PRODUCTION,
      ...details,
      quantity: Math.round(between(1, 5)),
      deadline: new Date(raisedAt.getTime() - 5 * DAY),
      decidedAt: new Date(raisedAt.getTime() - 2 * DAY),
      remarks: "",
      createdBy: owner._id,
      updatedBy: owner._id,
      createdAt: new Date(raisedAt.getTime() - 14 * DAY),
      updatedAt: raisedAt,
    });

    // Through the app's own generator, so the counters are left consistent.
    const orderNumber = await generateOrderNumber(company.name);

    const { entries, total } = buildLog(
      ordered,
      plan.progress,
      raisedAt,
      owner._id as mongoose.Types.ObjectId,
      owner.name,
      // Exactly one order carries a correction entry.
      i === 14
    );

    await ProductionOrder.create({
      company: company._id,
      companyName: company.name,
      sample: sample._id,
      sampleNumber: sample.sampleNumber,
      orderNumber,
      designNumber,
      status: plan.status,
      ...details,
      orderedMetres: ordered,
      completedMetres: total,
      startDate: plan.progress > 0 ? new Date(raisedAt.getTime() + 2 * DAY) : undefined,
      deadline: startOfDayUTC(new Date(Date.now() + plan.due * DAY)),
      estCompletion:
        plan.progress > 0
          ? startOfDayUTC(new Date(Date.now() + Math.max(1, plan.due - 2) * DAY))
          : undefined,
      machine: plan.progress > 0 ? pick(MACHINES) : "",
      operator: plan.progress > 0 ? pick(OPERATORS) : "",
      mendings: plan.progress > 0 ? Math.round(between(0, 14)) : 0,
      rejectedMetres: plan.progress > 0 ? between(0, 18) : 0,
      remarks: pick(REMARKS),
      log: entries,
      createdBy: owner._id,
      updatedBy: owner._id,
      // Explicit, or `timestamps` would stamp every order with today and the
      // date filter would have nothing to distinguish.
      createdAt: raisedAt,
      updatedAt: raisedAt,
    });

    orderCount += 1;
    logCount += entries.length;
  }

  /*
   * Today's production, so the dashboard's "today" tile is not zero. Added
   * after the fact to the most recently worked order.
   */
  const running = await ProductionOrder.findOne({ status: ORDER_STATUS.RUNNING })
    .sort({ createdAt: -1 })
    .exec();

  if (running) {
    const metres = between(30, 90);
    running.log.push({
      date: startOfDayUTC(),
      metres,
      note: "Today's lot.",
      loggedBy: owner._id,
      loggedByName: owner.name,
      createdAt: new Date(),
    } as never);
    running.completedMetres = Math.round((running.completedMetres + metres) * 10) / 10;
    await running.save();
    logCount += 1;
  }

  logger.info(`Created ${orderCount} orders with ${logCount} production log entries`);
  logger.info("Inventory seeded.");

  await mongoose.connection.close();
  process.exit(0);
};

/** The tag contains regex metacharacters, so it is escaped before matching. */
function escapeTag(): string {
  return SEED_TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

run().catch(async (error: unknown) => {
  logger.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
