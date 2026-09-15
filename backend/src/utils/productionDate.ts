/**
 * Production dates are days, not moments.
 *
 * "40 metres on the 15th" is a fact about a date, so every log entry is stored
 * at midnight UTC of the day it belongs to. Storing `new Date()` instead would
 * put a 10am IST entry at 04:30 UTC, and a "today" computed from server-local
 * midnight would then miss it — the floor would log work and watch the
 * dashboard read zero.
 *
 * Normalising both the write and the query through here is what keeps them in
 * step regardless of where the server happens to run.
 */
export const startOfDayUTC = (value: Date | string = new Date()): Date => {
  const d = typeof value === "string" ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : value;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/** The exclusive upper bound of a day, for range queries. */
export const endOfDayUTC = (value: Date | string = new Date()): Date => {
  const start = startOfDayUTC(value);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
};
