/**
 * The icons a production stage may wear.
 *
 * Only the id is stored, never a component or any markup.
 *
 * The reasoning is the same as the colour presets in themes.ts: the frontend
 * is the only side that renders these, so keeping the database to a validated
 * id means a compromised admin session cannot push arbitrary markup — or a
 * `url()` behind it — into every visitor's page.
 *
 * The ids are deliberately abstract rather than library names. Swapping icon
 * sets later is then a frontend change with no migration.
 */

export const DEFAULT_PROCESS_ICON_ID = "pen-tool";

/**
 * Chosen for a textile floor: drafting, machining, checking, finishing and
 * despatch, plus a few generic ones for stages we have not thought of.
 */
export const PROCESS_ICON_IDS: string[] = [
  "pen-tool",
  "edit",
  "layers",
  "grid",
  "cpu",
  "settings",
  "tool",
  "scissors",
  "zap",
  "search",
  "eye",
  "crosshair",
  "check-circle",
  "clipboard",
  "shield",
  "package",
  "box",
  "truck",
  "printer",
  "award",
];
