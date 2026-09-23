/**
 * Money.
 *
 * Amounts cross the wire and sit in the database as an integer number of
 * paise, never as rupees in a float. `0.1 + 0.2 !== 0.3`, and an expense total
 * that drifts by a paisa per row is the kind of bug nobody finds until someone
 * reconciles a month by hand. Rupees exist only at the two edges: what the
 * operator types, and what is printed back.
 */

/** Rupees as typed into a form → paise for the API. */
export const toPaise = (rupees) => {
  const value = Number(rupees);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
};

/** Paise from the API → rupees, for putting back into a form field. */
export const toRupees = (paise) => Number(paise ?? 0) / 100;

const formatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Paise → "₹1,23,456.78".
 *
 * Indian digit grouping, which `en-IN` gives us — a lakh is grouped 1,23,456
 * rather than 123,456, and this is read by people who would notice.
 */
export const formatRupees = (paise) => `₹${formatter.format(toRupees(paise))}`;

/** The same, without decimals — for totals where paise are just noise. */
const wholeFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const formatRupeesShort = (paise) => `₹${wholeFormatter.format(toRupees(paise))}`;
