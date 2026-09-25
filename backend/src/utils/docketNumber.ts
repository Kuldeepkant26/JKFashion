import { nextSeq, peekSeq } from "../models/counter.model.js";

/**
 * Numbers printed on dockets: `Dexter-JK-00109` for an order,
 * `Dexter-SMP-00012` for a sample.
 *
 * Shared by orders and samples so the two read as one system — same buyer
 * prefix, same padding, separate sequences.
 */

/**
 * The buyer's part of a number: the first word of their name, letters and
 * digits only.
 *
 * "Dexter Exports Pvt Ltd" → "Dexter". Punctuation and accents are stripped
 * rather than transliterated, because this string goes on a printed docket and
 * has to survive being read aloud, typed into a search box and written by hand.
 * A name with no usable characters at all (only symbols) falls back to "ORD" so
 * a number can always be issued.
 */
export const companyPrefix = (name: string): string => {
  const first = String(name ?? "").trim().split(/\s+/)[0] ?? "";
  const cleaned = first.normalize("NFD").replace(/[^A-Za-z0-9]/g, "");

  if (!cleaned) return "ORD";

  const capped = cleaned.slice(0, 12);
  return capped.charAt(0).toUpperCase() + capped.slice(1);
};

/**
 * One kind of number. `scope` names the counter (`order`, `sample`) and
 * `infix` is what sits between the buyer and the sequence.
 */
export const docketNumbering = (scope: string, infix: string) => {
  const key = (name: string): string => `${scope}:${companyPrefix(name)}`;
  const format = (name: string, seq: number): string =>
    `${companyPrefix(name)}-${infix}-${String(seq).padStart(5, "0")}`;

  return {
    /** Claim the next number. Atomic — safe from two requests at once. */
    next: async (name: string): Promise<string> => format(name, await nextSeq(key(name))),

    /** What `next` would return, without claiming it. Advisory only. */
    peek: async (name: string): Promise<string> => format(name, await peekSeq(key(name))),
  };
};
