/**
 * Theme ids the API will accept.
 *
 * GENERATED — edit scripts/gen-themes.mjs in the repo root and re-run
 * `npm run themes` from the frontend.
 *
 * Only the ids live here. The hex values are the frontend's concern, because
 * it is the only side that renders them — and storing a validated id rather
 * than client-supplied colour means a compromised session cannot inject
 * arbitrary CSS values into every visitor's page.
 *
 * Mirrors the shape of ROLES / ROLE_VALUES in ./constants.js.
 */
export const DEFAULT_THEME_ID = "signature-pink";

export const THEME_IDS: string[] = [
  "signature-pink",
  "rose-noir",
  "blush-atelier",
  "magenta-bloom",
  "fuchsia-silk",
  "plum-couture",
  "cerise-luxe",
  "orchid-haze",
  "raspberry-ink",
  "coral-rouge",
  "sunset-amber",
  "golden-hour",
  "terracotta",
  "crimson-velvet",
  "copper-dusk",
  "ocean-deep",
  "emerald-atelier",
  "royal-indigo",
  "violet-noir",
  "teal-studio",
  "midnight-sapphire",
  "arctic-slate",
  "lagoon-mist",
  "monochrome",
  "ivory-noir",
  "charcoal-gold",
  "espresso",
  "sage-linen",
  "graphite-mint",
  "bordeaux",
];
