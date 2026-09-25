/**
 * Order-specific constants.
 *
 * The generic ones — input styling, date helpers, range presets — live in
 * `admin/constants/ui.js` and are re-exported here so existing imports in this
 * folder keep working and this file stays the one place an orders screen
 * imports from.
 */
export {
  MAIN_ADMIN,
  inputClass,
  labelClass,
  formatDate,
  toDateInput,
  DATE_PRESETS,
} from '../../constants/ui.js';

// Metres are this section's unit; the shared formatter is unit-agnostic.
export { formatQuantity as formatMetres } from '../../constants/ui.js';

/**
 * Mirrors ORDER_STATUSES in the API's productionOrder model, in lifecycle
 * order. Sampling is not here: samples are their own records (SAMPLE_STATUSES
 * below), and an order is raised once the buyer approves one.
 */
export const ORDER_STATUSES = ['PENDING', 'RUNNING', 'PAUSED', 'COMPLETED'];

export const STATUS_LABELS = {
  // Legacy: rows from before samples were split out, until they are migrated.
  SAMPLING: 'Sampling (old)',
  PENDING: 'Pending',
  RUNNING: 'Running',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
};

export const STATUS_STYLES = {
  SAMPLING: 'bg-violet-50 text-violet-700',
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

/** Mirrors SAMPLE_STATUSES in the API's sample model, in lifecycle order. */
export const SAMPLE_STATUSES = ['IN_PROGRESS', 'SENT', 'APPROVED', 'REJECTED'];

export const SAMPLE_STATUS_LABELS = {
  IN_PROGRESS: 'In progress',
  SENT: 'Sent to buyer',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  OVERDUE: 'Overdue',
};

export const SAMPLE_STATUS_STYLES = {
  IN_PROGRESS: 'bg-violet-50 text-violet-700',
  SENT: 'bg-sky-50 text-sky-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-brand-ink/8 text-brand-ink/60',
  OVERDUE: 'bg-rose-50 text-rose-700',
};

export const SAMPLE_FILTERS = [
  { value: '', label: 'All' },
  ...SAMPLE_STATUSES.map((s) => ({ value: s, label: SAMPLE_STATUS_LABELS[s] })),
];

/** Metres from a repeat given in inches. */
export const INCH_IN_METRES = 0.0254;
