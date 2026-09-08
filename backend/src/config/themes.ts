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

/**
 * Typography pairing ids the API will accept.
 *
 * Same rule as the palette: only the id is stored and validated here, while
 * the actual font stacks live in frontend/src/theme/fonts.js — which this
 * generator imports, so the allowlist cannot drift from the real pairings.
 */
export const DEFAULT_FONT_ID = "playfair-montserrat";

export const FONT_IDS: string[] = [
  "playfair-montserrat",
  "cormorant-inter",
  "dmserif-dmsans",
  "fraunces-worksans",
  "marcellus-jost",
  "libre-source",
  "italiana-lato",
  "system",
];

/**
 * Navbar and hero layout ids the API will accept.
 *
 * Same rule again: the id selects a React component that lives in the
 * frontend, so only a value from this list can ever reach a visitor's page.
 */
export const DEFAULT_NAVBAR_ID = "floating-pill";

export const NAVBAR_IDS: string[] = [
  "floating-pill",
  "minimal-rule",
  "centered-logo",
  "edge-bar",
];

export const DEFAULT_HERO_ID = "classic-split";

export const HERO_IDS: string[] = [
  "classic-split",
  "centre-stage",
  "full-bleed",
  "editorial",
];
