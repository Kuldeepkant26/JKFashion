import { nextSeq, peekSeq } from "../models/counter.model.js";

/**
 * Job numbers, printed on sample tags and order dockets: `JK-COR-01`.
 *
 *   JK   the house mark
 *   COR  the buyer's code — the first three letters of their name
 *   01   the count, two digits, growing to three after the ninety-ninth
 *
 * One number per piece of work, from sampling into production:
 *
 *   - a new sample takes the next number;
 *   - an order converted from a sample keeps that sample's number — it is the
 *     same job, confirmed — so JK-COR-01 the sample becomes JK-COR-01 the order;
 *   - an order created directly, with no sample, takes the next number.
 *
 * Samples and direct orders draw from one counter per buyer code, so no two
 * different jobs are ever handed the same number. The counter is atomic (see
 * counter.model): two people raising work at the same moment cannot collide.
 *
 * This is the only place the format is defined — the services, the seed and
 * the migrations all import it, so a number can only ever come out one way.
 */

const pad = (seq: number, width: number): string => String(seq).padStart(width, "0");

/** A job number in the current format, capturing its buyer code and count. */
export const JOB_NUMBER_PATTERN = /^JK-([A-Z0-9]{1,3})-(\d{2,})$/;

/**
 * The buyer's code: the first three letters or digits of their name, in
 * capitals.
 *
 * "Cornell" → "COR", "Orange International" → "ORA", "A & B Traders" →
 * "ABT". Spaces and punctuation are skipped rather than counted, and accents
 * stripped, because the number goes on a docket and has to survive being read
 * aloud, typed into a search box and written by hand. A shorter name gives a
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
 * The counter a buyer code draws from.
 *
 * Keyed by the code, not the buyer, so numbers stay unique: two buyers whose
 * names start alike ("Cornell", "Cortex") share the COR count rather than both
 * being handed JK-COR-01. The key says "sample" because samples used it first;
 * it is kept so installs that have already issued numbers carry on from them.
 */
export const jobCounterKey = (code: string): string => `sample-code:${code}`;

export interface JobNumbering {
  /** Format a number for this buyer from a count. */
  format: (companyName: string, seq: number) => string;
  /** Claim the next number. Atomic — safe from two requests at once. */
  next: (companyName: string) => Promise<string>;
  /** What `next` would return, without claiming it. Advisory only. */
  peek: (companyName: string) => Promise<string>;
}

const format = (companyName: string, seq: number): string =>
  `JK-${companyCode(companyName)}-${pad(seq, 2)}`;

const key = (companyName: string): string => jobCounterKey(companyCode(companyName));

export const jobNumbers: JobNumbering = {
  format,
  next: async (companyName) => format(companyName, await nextSeq(key(companyName))),
  peek: async (companyName) => format(companyName, await peekSeq(key(companyName))),
};
