/**
 * Makes a user-typed string safe to put inside a RegExp.
 *
 * Search boxes are the first place in this API where user input reaches a
 * regex. Unescaped, a stray "(" is a 500 and a pathological pattern is a CPU
 * denial of service against our own database — so every search term goes
 * through here before it becomes a RegExp.
 */
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
