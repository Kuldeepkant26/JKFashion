/**
 * A design's repeat, as the floor writes it: in quarters of a Swiss inch —
 * "4/4", "8/4", "16/4" — which is how a schiffli machine measures it.
 *
 * Kept as text, exactly as written, because that is the notation on every
 * docket; a bare number is still accepted, so repeats saved before this (in
 * inches) stay valid when their record is edited and saved again.
 */
export const REPEAT_PATTERN = /^\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?$/;

/**
 * "8//4", " 8 / 4 " → "8/4": how it gets typed on a phone, tidied to how it
 * is written. Numbers from older clients arrive as numbers, so they are
 * stringified first.
 */
export const normalizeRepeat = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, "")
    .replace(/\/+/g, "/");
