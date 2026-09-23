/**
 * Stock-ledger constants.
 *
 * The category list itself is NOT duplicated here — the API ships it with the
 * item list, so there is one definition of what categories exist, their units
 * and whether breakage applies. Only presentation lives here.
 */
export {
  MAIN_ADMIN,
  inputClass,
  labelClass,
  formatDate,
  formatQuantity,
  toDateInput,
  today,
  DATE_PRESETS,
} from '../../constants/ui.js';

export { formatRupees, formatRupeesShort, toPaise, toRupees } from '../../constants/money.js';

/** Mirrors ENTRY_DIRECTIONS on the API — what an operator may record. */
export const ENTRY_DIRECTIONS = ['IN', 'OUT', 'BREAK'];

export const DIRECTION_LABELS = {
  IN: 'In',
  OUT: 'Out',
  BREAK: 'Break',
  CORRECTION: 'Correction',
};

/**
 * Green for stock arriving, red for stock leaving, amber for breakage, and a
 * neutral tone for a hand-entered correction — so a column of entries can be
 * read at a glance without parsing the sign of each number.
 */
export const DIRECTION_STYLES = {
  IN: 'bg-emerald-50 text-emerald-700',
  OUT: 'bg-rose-50 text-rose-700',
  BREAK: 'bg-amber-50 text-amber-700',
  CORRECTION: 'bg-brand-ink/8 text-brand-ink/60',
};

/** The sign shown before a quantity. Corrections carry their own. */
export const DIRECTION_SIGN = {
  IN: '+',
  OUT: '−',
  BREAK: '−',
  CORRECTION: '',
};

export const STOCK_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'materials', label: 'Materials' },
  { key: 'report', label: 'Daily Report' },
  { key: 'expenses', label: 'Expenses' },
];
