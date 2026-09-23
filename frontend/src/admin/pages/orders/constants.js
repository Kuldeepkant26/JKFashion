/** Mirrors ROLES.MAIN_ADMIN on the API — the seeded owner. */
export const MAIN_ADMIN = 'MAIN_ADMIN';

/** Mirrors ORDER_STATUSES in the API's productionOrder model. */
export const ORDER_STATUSES = ['PENDING', 'RUNNING', 'PAUSED', 'COMPLETED'];

export const STATUS_LABELS = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
};

export const STATUS_STYLES = {
  PENDING: 'bg-brand-ink/8 text-brand-ink/60',
  RUNNING: 'bg-sky-50 text-sky-700',
  PAUSED: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  OVERDUE: 'bg-rose-50 text-rose-700',
};

/**
 * "Overdue" sits alongside the real statuses in the filter bar even though it
 * is derived, because that is how the floor thinks about it — the API
 * translates it into a deadline query.
 */
export const FILTERS = [
  { value: '', label: 'All' },
  ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  { value: 'OVERDUE', label: 'Overdue' },
];

/** Mirrors the API's own cap, so an oversized file is caught before upload. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

export const inputClass =
  'w-full rounded-xl bg-surface-card px-3.5 py-2.5 font-body text-sm text-brand-ink ' +
  'ring-1 ring-brand-ink/12 transition-shadow placeholder:text-brand-ink/35 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-pink';

export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/** Metres read better without trailing zeroes: 125 rather than 125.0. */
export const formatMetres = (n) => {
  const value = Number(n ?? 0);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

/** An ISO date for an <input type="date">, which wants exactly YYYY-MM-DD. */
export const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '');
