/**
 * Formatting for the dashboard's figures. Indian digit grouping throughout
 * (1,23,456), because that is how these numbers are read.
 */
import { toRupees } from '../../constants/money.js';

const whole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

/** Metres: a decimal only while it still means something (12.5m, 1,240m). */
export const metres = (n) => `${(Math.abs(n) >= 1000 ? whole : oneDecimal).format(n ?? 0)}m`;

/** A count, grouped. */
export const count = (n) => whole.format(n ?? 0);

/** Rupees from paise, whole. */
export const rupees = (paise) => `₹${whole.format(toRupees(paise ?? 0))}`;

/** Rupees from paise, compact — for axis ticks: ₹45K, ₹1.2L. */
export const rupeesCompact = (paise) => `₹${compact.format(toRupees(paise ?? 0))}`;

/** A short date from YYYY-MM-DD: "29 Sep". Parsed as UTC, as it was written. */
export const shortDate = (iso) =>
  new Date(`${String(iso).slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

/** A month from YYYY-MM: "Sep". */
export const monthName = (key, style = 'short') =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-IN', {
    month: style,
    ...(style === 'long' ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });

/**
 * Change against a previous period, as a signed whole percentage — or null
 * when there is nothing to compare with (a jump from zero is not a percentage).
 */
export const percentChange = (now, before) => {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
};

/** "Good morning" by the viewer's own clock. */
export const greeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Days from today to a deadline: negative when it has passed. UTC days. */
export const daysUntil = (iso) => {
  const d = new Date(iso);
  const due = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((due - today) / 86_400_000);
};
