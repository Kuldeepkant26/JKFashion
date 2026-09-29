import {
  ProductionOrder,
  ORDER_STATUS,
  OPEN_ORDER_STATUSES,
  LEGACY_ORDER_STATUS,
} from "../models/productionOrder.model.js";
import { Sample, SAMPLE_STATUS, OPEN_SAMPLE_STATUSES } from "../models/sample.model.js";
import { Enquiry, ENQUIRY_STATUS } from "../models/enquiry.model.js";
import { Expense } from "../models/expense.model.js";
import { StockItem } from "../models/stockItem.model.js";
import { StockMovement } from "../models/stockMovement.model.js";
import { Company } from "../models/company.model.js";
import { startOfDayUTC, endOfDayUTC } from "../utils/productionDate.js";

/**
 * The dashboard: what is happening across the business, in one read.
 *
 * Every figure is live — counted from the collections this panel owns, never
 * a placeholder. Days are UTC days, the same normalisation production entries
 * are written with (see utils/productionDate), so "today" here is the "today"
 * the floor logged against.
 *
 * Money and stock are included only for an account that can open the
 * Inventory Management section, where those figures live; everything else is
 * the business overview any account with Dashboard access may see.
 */

const DAY = 24 * 60 * 60 * 1000;

/** The production chart's windows, in days. */
export const DASHBOARD_RANGES = [7, 30, 90] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

/** How far ahead "due soon" looks, and how many rows the short lists carry. */
const DUE_SOON_DAYS = 7;
const LIST_LIMIT = 6;
const TOP_BUYERS = 5;
const ENQUIRY_WEEKS = 12;
const EXPENSE_MONTHS = 6;

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);
const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Monday 00:00 UTC of the week `d` falls in. */
const weekStart = (d: Date): Date => {
  const day = startOfDayUTC(d);
  const offset = (day.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(day.getTime() - offset * DAY);
};

const monthKey = (d: Date): string => d.toISOString().slice(0, 7);

/**
 * Metres logged per day, oldest first, one entry for every day — including
 * the days nothing was made, so the chart's gaps are real zeros.
 */
const productionByDay = async (days: number): Promise<{ date: string; metres: number }[]> => {
  const today = startOfDayUTC();
  const from = new Date(today.getTime() - (days - 1) * DAY);
  const to = endOfDayUTC();

  const rows = await ProductionOrder.aggregate<{ _id: Date; metres: number }>([
    // The outer match uses the index on log.date to skip orders untouched in the window.
    { $match: { "log.date": { $gte: from } } },
    { $unwind: "$log" },
    { $match: { "log.date": { $gte: from, $lt: to } } },
    { $group: { _id: "$log.date", metres: { $sum: "$log.metres" } } },
  ]).exec();

  const byDay = new Map(rows.map((r) => [isoDay(new Date(r._id)), r.metres]));

  return Array.from({ length: days }, (_, i) => {
    const date = isoDay(new Date(from.getTime() + i * DAY));
    return { date, metres: round1(byDay.get(date) ?? 0) };
  });
};

const sum = (values: number[]): number => round1(values.reduce((a, b) => a + b, 0));

const orderFigures = async (range: DashboardRange) => {
  const today = startOfDayUTC();
  const dueBy = new Date(today.getTime() + DUE_SOON_DAYS * DAY);

  /*
   * Twice the window, so the chosen period can be compared with the one
   * before it — and never less than a fortnight, which the "produced today"
   * sparkline shows whatever the range.
   */
  const span = Math.max(range * 2, 14);

  const [series, open, byStatus, overdue, dueSoon, buyers, activeBuyers] = await Promise.all([
    productionByDay(span),
    ProductionOrder.aggregate<{
      count: number;
      ordered: number;
      produced: number;
      remaining: number;
    }>([
      { $match: { status: { $in: OPEN_ORDER_STATUSES } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          ordered: { $sum: "$orderedMetres" },
          produced: { $sum: "$completedMetres" },
          remaining: {
            $sum: { $max: [0, { $subtract: ["$orderedMetres", "$completedMetres"] }] },
          },
        },
      },
    ]).exec(),
    ProductionOrder.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
    ProductionOrder.countDocuments({
      deadline: { $ne: null, $lt: today },
      status: { $in: OPEN_ORDER_STATUSES },
    }).exec(),
    ProductionOrder.find({
      status: { $in: OPEN_ORDER_STATUSES },
      deadline: { $ne: null, $lt: dueBy },
    })
      .select("orderNumber companyName designNumber deadline orderedMetres completedMetres status")
      .sort({ deadline: 1 })
      .limit(LIST_LIMIT)
      .lean()
      .exec(),
    ProductionOrder.aggregate<{
      _id: unknown;
      name: string;
      remaining: number;
      orders: number;
    }>([
      { $match: { status: { $in: OPEN_ORDER_STATUSES } } },
      {
        $group: {
          _id: "$company",
          name: { $first: "$companyName" },
          orders: { $sum: 1 },
          remaining: {
            $sum: { $max: [0, { $subtract: ["$orderedMetres", "$completedMetres"] }] },
          },
        },
      },
      { $match: { remaining: { $gt: 0 } } },
      { $sort: { remaining: -1 } },
      { $limit: TOP_BUYERS },
    ]).exec(),
    Company.countDocuments({ isActive: true }).exec(),
  ]);

  const current = series.slice(-range);
  const previous = series.slice(-range * 2, -range);
  const best = current.reduce((a, b) => (b.metres > a.metres ? b : a), current[0]!);
  const totals = open[0] ?? { count: 0, ordered: 0, produced: 0, remaining: 0 };

  // A legacy SAMPLING row is outstanding work that has not started: pending.
  const pipeline: Record<string, number> = { PENDING: 0, RUNNING: 0, PAUSED: 0, COMPLETED: 0 };
  for (const row of byStatus) {
    const key = row._id === LEGACY_ORDER_STATUS.SAMPLING ? ORDER_STATUS.PENDING : row._id;
    pipeline[key] = (pipeline[key] ?? 0) + row.count;
  }

  return {
    active: {
      count: totals.count,
      remainingMetres: round1(totals.remaining),
    },
    overdue,
    today: {
      metres: series[series.length - 1]!.metres,
      yesterday: series[series.length - 2]!.metres,
      trend: series.slice(-14).map((d) => d.metres),
    },
    production: {
      range,
      days: current,
      total: sum(current.map((d) => d.metres)),
      previousTotal: sum(previous.map((d) => d.metres)),
      dailyAverage: round1(sum(current.map((d) => d.metres)) / range),
      bestDay: best.metres > 0 ? best : null,
    },
    completion: {
      ordered: round1(totals.ordered),
      produced: round1(totals.produced),
      pct: totals.ordered > 0 ? Math.min(100, (totals.produced / totals.ordered) * 100) : 0,
    },
    pipeline,
    dueSoon: dueSoon.map((o) => ({
      ...o,
      isOverdue: Boolean(o.deadline && new Date(o.deadline).getTime() < today.getTime()),
    })),
    topBuyers: buyers.map((b) => ({
      companyId: String(b._id),
      name: b.name,
      orders: b.orders,
      remainingMetres: round1(b.remaining),
    })),
    activeBuyers,
  };
};

const sampleFigures = async () => {
  const today = startOfDayUTC();

  const [byStatus, overdue] = await Promise.all([
    Sample.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).exec(),
    Sample.countDocuments({
      status: SAMPLE_STATUS.IN_PROGRESS,
      deadline: { $ne: null, $lt: today },
    }).exec(),
  ]);

  const counts: Record<string, number> = {
    IN_PROGRESS: 0,
    DELIVERED: 0,
    APPROVED: 0,
    IN_PRODUCTION: 0,
    REJECTED: 0,
  };
  for (const row of byStatus) counts[row._id] = row.count;

  return {
    counts,
    open: OPEN_SAMPLE_STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0),
    delivered: counts.DELIVERED ?? 0,
    ready: counts.APPROVED ?? 0,
    overdue,
  };
};

const enquiryFigures = async () => {
  const thisWeek = weekStart(new Date());
  const from = new Date(thisWeek.getTime() - (ENQUIRY_WEEKS - 1) * 7 * DAY);

  const [newCount, inWindow, recent] = await Promise.all([
    Enquiry.countDocuments({ status: ENQUIRY_STATUS.NEW }).exec(),
    // A few a week at most — bucketed here rather than in the database.
    Enquiry.find({ createdAt: { $gte: from } }).select("createdAt").lean().exec(),
    Enquiry.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name company message status createdAt")
      .lean()
      .exec(),
  ]);

  const weeks = Array.from({ length: ENQUIRY_WEEKS }, (_, i) => ({
    week: isoDay(new Date(from.getTime() + i * 7 * DAY)),
    count: 0,
  }));
  const index = new Map(weeks.map((w, i) => [w.week, i]));
  for (const e of inWindow) {
    const i = index.get(isoDay(weekStart(new Date(e.createdAt))));
    if (i !== undefined) weeks[i]!.count += 1;
  }

  return {
    new: newCount,
    thisWeek: weeks[weeks.length - 1]!.count,
    weeks,
    recent: recent.map((e) => ({
      id: String(e._id),
      name: e.name,
      company: e.company,
      message: e.message,
      status: e.status,
      createdAt: e.createdAt,
    })),
  };
};

const stockFigures = async () => {
  const now = new Date();
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (EXPENSE_MONTHS - 1), 1));

  const [expenses, flagged, flaggedCount, entriesToday] = await Promise.all([
    Expense.find({ date: { $gte: firstMonth } }).select("date amountPaise").lean().exec(),
    StockItem.find({ isArchived: false, needsCorrection: true })
      .select("name category unit balance")
      .sort({ balance: 1 })
      .limit(LIST_LIMIT)
      .lean()
      .exec(),
    StockItem.countDocuments({ isArchived: false, needsCorrection: true }).exec(),
    StockMovement.countDocuments({ date: { $gte: startOfDayUTC(), $lt: endOfDayUTC() } }).exec(),
  ]);

  const months = Array.from({ length: EXPENSE_MONTHS }, (_, i) => ({
    month: monthKey(new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + i, 1))),
    paise: 0,
  }));
  const index = new Map(months.map((m, i) => [m.month, i]));
  for (const e of expenses) {
    const i = index.get(monthKey(new Date(e.date)));
    if (i !== undefined) months[i]!.paise += e.amountPaise;
  }

  return {
    expenses: {
      months,
      thisMonth: months[months.length - 1]!.paise,
      lastMonth: months[months.length - 2]!.paise,
    },
    needsCount: {
      count: flaggedCount,
      items: flagged.map((i) => ({
        id: String(i._id),
        name: i.name,
        category: i.category,
        unit: i.unit,
        balance: i.balance,
      })),
    },
    entriesToday,
  };
};

export interface DashboardOptions {
  range: DashboardRange;
  /** Include money and stock — for an account that can open that section. */
  withStock: boolean;
}

export const getDashboard = async ({ range, withStock }: DashboardOptions) => {
  const [orders, samples, enquiries, stock] = await Promise.all([
    orderFigures(range),
    sampleFigures(),
    enquiryFigures(),
    withStock ? stockFigures() : Promise.resolve(null),
  ]);

  return { orders, samples, enquiries, stock, generatedAt: new Date() };
};
