/**
 * The navbar and hero layouts a Super Admin can choose from.
 *
 * Same contract as themes.js and fonts.js: an id is stored server-side, and the
 * markup lives in the frontend — so a compromised session can only select from
 * this list, never inject a layout.
 *
 * Adding a variant is two steps: append an entry here, and add the matching
 * case to the switch in components/navbars/index.jsx (or heroes/index.jsx).
 * Nothing else needs to change — the admin picker, the API allowlist and the
 * public site all read from these arrays.
 */

/** @typedef {{ id: string, name: string, note: string }} LayoutVariant */

/** @type {LayoutVariant[]} */
export const NAVBAR_VARIANTS = [
  {
    id: 'floating-pill',
    name: 'Floating Pill',
    note: 'A rounded capsule that floats clear of the page edge. Blurred, with a soft shadow.',
  },
  {
    id: 'minimal-rule',
    name: 'Minimal Rule',
    note: 'Widely-spaced links over a hairline. The quietest of the set.',
  },
  {
    id: 'centered-logo',
    name: 'Centered Logo',
    note: 'Logo centred with the links split either side. Reads like a fashion masthead.',
  },
  {
    id: 'edge-bar',
    name: 'Edge Bar',
    note: 'Full-width and flush to the top, with an underline that tracks the active page.',
  },
];

/** @type {LayoutVariant[]} */
export const HERO_VARIANTS = [
  {
    id: 'classic-split',
    name: 'Classic Split',
    note: 'Copy on the left, the cut-out on the right. The current site layout.',
  },
  {
    id: 'centre-stage',
    name: 'Centre Stage',
    note: 'Centred headline with the artwork beneath it. Strong on narrow screens.',
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    note: 'Artwork edge to edge with the copy laid over a soft scrim.',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    note: 'Oversized type, asymmetric placement, the artwork offset behind it.',
  },
];

export const DEFAULT_NAVBAR_ID = 'floating-pill';
export const DEFAULT_HERO_ID = 'classic-split';

export const NAVBAR_IDS = NAVBAR_VARIANTS.map((v) => v.id);
export const HERO_IDS = HERO_VARIANTS.map((v) => v.id);

/** Never throw on an unknown id — fall back rather than render nothing. */
export const getNavbarVariant = (id) =>
  NAVBAR_VARIANTS.find((v) => v.id === id) ?? NAVBAR_VARIANTS[0];

export const getHeroVariant = (id) =>
  HERO_VARIANTS.find((v) => v.id === id) ?? HERO_VARIANTS[0];
