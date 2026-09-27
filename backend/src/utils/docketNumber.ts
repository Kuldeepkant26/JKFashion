import { nextSeq, peekSeq } from "../models/counter.model.js";

/**
 * Numbers printed on dockets and sample tags.
 *
 *   order   Dexter-JK-00109   buyer's first word, house mark, five digits
 *   sample  JK-COR-01         house mark, three-letter buyer code, two digits
 *
 * Each is drawn from an atomic counter (see counter.model), so two people
 * raising one at the same moment can never be handed the same number. Both
 * formats are defined here and only here — the services, the seed and the
 * migrations all import them, so a number can only ever come out one way.
 */

const pad = (seq: number, width: number): string => String(seq).padStart(width, "0");

/**
 * The buyer's part of an order number: the first word of their name, letters
 * and digits only.
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
 * The buyer's code on a sample number: the first three letters or digits of
 * their name, in capitals.
 *
 * "Cornell" → "COR", "Dexter Apparels Pvt Ltd" → "DEX", "A & B Traders" →
 * "ABT". Spaces and punctuation are skipped rather than counted, and accents
 * stripped, for the same reason as `companyPrefix`. A shorter name gives a
 * shorter code ("LG" → "LG"); one with no usable characters falls back to
 * "SMP" so a number can always be issued.
 */
export const companyCode = (name: string): string => {
  const cleaned = String(name ?? "")
    .normalize("NFD")
    .replace(/[^A-Za-z0-9]/g, "");

  return cleaned ? cleaned.slice(0, 3).toUpperCase() : "SMP";
};

/**
 * The counter a sample code draws from.
 *
 * Keyed by the code, not the buyer, so the number stays unique: two buyers
 * whose names start alike ("Cornell", "Cortex") share the COR sequence rather
 * than both being handed JK-COR-01. Its own namespace, apart from the counters
 * the old sample format used, so the new sequences start fresh.
 */
export const sampleCounterKey = (code: string): string => `sample-code:${code}`;

export interface DocketNumbering {
  /** Format a number for this buyer from a sequence value. */
  format: (companyName: string, seq: number) => string;
  /** Claim the next number. Atomic — safe from two requests at once. */
  next: (companyName: string) => Promise<string>;
  /** What `next` would return, without claiming it. Advisory only. */
  peek: (companyName: string) => Promise<string>;
}

const numbering = (
  key: (companyName: string) => string,
  format: (companyName: string, seq: number) => string
): DocketNumbering => ({
  format,
  next: async (companyName) => format(companyName, await nextSeq(key(companyName))),
  peek: async (companyName) => format(companyName, await peekSeq(key(companyName))),
});

/**
 * Order numbers, e.g. `Dexter-JK-00109`. Per-buyer: the number is read off a
 * docket next to the buyer's name, and a shared sequence would make two
 * adjacent jobs for the same buyer look unrelated.
 */
export const orderNumbers = numbering(
  (name) => `order:${companyPrefix(name)}`,
  (name, seq) => `${companyPrefix(name)}-JK-${pad(seq, 5)}`
);

/**
 * Sample numbers, e.g. `JK-COR-01` for Cornell's first sample. Two digits,
 * growing to three after the ninety-ninth (`JK-COR-100`).
 */
export const sampleNumbers = numbering(
  (name) => sampleCounterKey(companyCode(name)),
  (name, seq) => `JK-${companyCode(name)}-${pad(seq, 2)}`
);
