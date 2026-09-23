/**
 * Shared admin UI constants and formatters.
 *
 * These began in the orders section, but the stock ledger needs the same input
 * styling, the same date handling and the same range presets. Importing them
 * from one page folder into another would tie two unrelated sections together,
 * so they live here and each section re-exports what it uses.
 */

/** Mirrors ROLES.MAIN_ADMIN on the API — the seeded owner. */
export const MAIN_ADMIN = 'MAIN_ADMIN';

export const inputClass =
  'w-full rounded-xl bg-surface-card px-3.5 py-2.5 font-body text-sm text-brand-ink ' +
  'ring-1 ring-brand-ink/12 transition-shadow placeholder:text-brand-ink/35 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-pink';

export const labelClass =
  'font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60';

export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/**
 * Quantities read better without trailing zeroes: 125 rather than 125.0.
 * Used for metres, kilos and pieces alike — the unit is rendered separately.
 */
export const formatQuantity = (n) => {
  const value = Number(n ?? 0);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

/** An ISO date for an <input type="date">, which wants exactly YYYY-MM-DD. */
export const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '');

/**
 * A local calendar date as YYYY-MM-DD.
 *
 * Deliberately not `toISOString().slice(0,10)`: that converts to UTC first, so
 * midnight on the 1st in IST comes back as the 30th of the previous month and
 * every preset would start a day early.
 */
export const localDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

export const today = () => localDate(new Date());

const shiftDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDate(d);
};

/**
 * The date-range shortcuts.
 *
 * Each returns `{ from, to }` as YYYY-MM-DD, or empty strings for "all time".
 */
export const DATE_PRESETS = [
  { value: '', label: 'All time', range: () => ({ from: '', to: '' }) },
  { value: '7d', label: 'Last 7 days', range: () => ({ from: shiftDays(-6), to: '' }) },
  { value: '30d', label: 'Last 30 days', range: () => ({ from: shiftDays(-29), to: '' }) },
  {
    value: 'month',
    label: 'This month',
    range: () => {
      const d = new Date();
      return { from: localDate(new Date(d.getFullYear(), d.getMonth(), 1)), to: '' };
    },
  },
  { value: '3m', label: 'Last 3 months', range: () => ({ from: shiftDays(-89), to: '' }) },
];
