/**
 * Authoring-time preset builder + linter.
 *
 * Emits frontend/src/theme/themes.js and backend/src/config/themes.ts, and
 * refuses to write either unless every preset passes the contrast rules that
 * keep gradients from collapsing into a flat smear and text readable.
 */
import { writeFileSync } from 'node:fs';
import { FONT_IDS, DEFAULT_FONT_ID } from '../frontend/src/theme/fonts.js';
import {
  NAVBAR_IDS, DEFAULT_NAVBAR_ID, HERO_IDS, DEFAULT_HERO_ID,
} from '../frontend/src/theme/layouts.js';

/* ---------- colour math ---------- */

const hexToRgb = (h) => {
  const v = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};

const srgbToLinear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** Relative luminance, WCAG 2.1. */
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** sRGB -> OKLab -> OKLCH. Used for the gradient-separation rule. */
const oklch = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.hypot(A, B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: L * 100, C, H };
};

/** Shortest angular distance between two hues, 0-180. */
const hueDelta = (h1, h2) => {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
};

/* ---------- presets ---------- */
// primary  = dominant brand colour        (was gold, 154 refs)
// secondary= gradient partner / contrast  (was forest green, 89 refs)
// accent   = third-role highlight         (was light yellow, 16 refs)
// ink      = darkest text/structural      (was navy, 73 refs)
// onPrimary= label colour on a primary fill (authored, not derived)

/**
 * Label colour for a primary-filled control.
 *
 * Chosen, not authored: for a saturated mid-tone like the brand pink, white
 * lands at 3.46:1 (fails AA for body text) while near-black reaches 5.72:1.
 * Picking whichever side wins guarantees every one of the 30 presets clears
 * 4.5:1 without hand-tuning, and it is why buttons stay readable when a
 * Super Admin switches to a pale preset.
 */
const pickOnPrimary = (primary, ink) => {
  const light = '#FFFFFF';
  const dark = luminance(ink) < 0.15 ? ink : '#0A0A0A';
  return contrast(dark, primary) >= contrast(light, primary) ? dark : light;
};

const P = (id, name, scheme, primary, primaryDeep, secondary, accent, ink) => ({
  id, name, scheme,
  colors: {
    primary, primaryDeep, secondary, accent, ink,
    neutral: scheme === 'dark' ? '#A8A8A8' : '#373737',
    neutralSoft: scheme === 'dark' ? '#3A3A3A' : '#D6D6D6',
    onPrimary: pickOnPrimary(primary, ink),
  },
});

const THEMES = [
  // ---- pink family (10) — true to the JK logo ----
  P('signature-pink', 'Signature Pink', 'light', '#FF2E93', '#E01B77', '#7B1E52', '#FF87C2', '#0A0A0A'),
  P('rose-noir', 'Rose Noir', 'dark', '#FF4FA3', '#E02D86', '#4A0F2E', '#FFA8CE', '#F5F0F2'),
  P('blush-atelier', 'Blush Atelier', 'light', '#E86A9C', '#C94F80', '#3D2430', '#F7C2D6', '#241A1E'),
  P('magenta-bloom', 'Magenta Bloom', 'light', '#D6197D', '#B01064', '#4B1440', '#F58BC0', '#14060F'),
  P('fuchsia-silk', 'Fuchsia Silk', 'light', '#F0329B', '#CE1F81', '#5C1B4D', '#FFA0D0', '#180612'),
  P('plum-couture', 'Plum Couture', 'light', '#A8317A', '#8A2463', '#2E0F28', '#E68CC4', '#1C0A18'),
  P('cerise-luxe', 'Cerise Luxe', 'light', '#E31C6A', '#C21255', '#45122F', '#FF8FB4', '#160509'),
  P('orchid-haze', 'Orchid Haze', 'light', '#CE6BBD', '#A33C90', '#35204A', '#EFA9E0', '#1E1226'),
  P('raspberry-ink', 'Raspberry Ink', 'dark', '#FF3D7F', '#DB2463', '#3B0A20', '#FF9BBE', '#F3EEF0'),
  P('coral-rouge', 'Coral Rouge', 'light', '#FF5C7A', '#E03D5C', '#5E1A2A', '#FFB0BF', '#1F0A10'),

  // ---- warm (5) ----
  P('sunset-amber', 'Sunset Amber', 'light', '#F97316', '#D65A08', '#7C2D12', '#FDBA74', '#1C1006'),
  P('golden-hour', 'Golden Hour', 'light', '#E0A312', '#BC860A', '#4A3410', '#F6D58A', '#1E1806'),
  P('terracotta', 'Terracotta', 'light', '#D4785C', '#A4432A', '#3A1A12', '#E9A98F', '#1D0F0A'),
  P('crimson-velvet', 'Crimson Velvet', 'dark', '#E23B4E', '#C22638', '#3C0A12', '#F5949E', '#F2EDEE'),
  P('copper-dusk', 'Copper Dusk', 'light', '#B87333', '#9A5C22', '#33200E', '#E3B584', '#1B1108'),

  // ---- cool (8) ----
  P('ocean-deep', 'Ocean Deep', 'light', '#0EA5E9', '#0284C7', '#0C4A6E', '#7DD3FC', '#06131C'),
  P('emerald-atelier', 'Emerald Atelier', 'light', '#10B981', '#059669', '#064E3B', '#6EE7B7', '#04120C'),
  P('royal-indigo', 'Royal Indigo', 'light', '#4F46E5', '#4338CA', '#1E1B4B', '#A5B4FC', '#0B0A1F'),
  P('violet-noir', 'Violet Noir', 'dark', '#A855F7', '#9333EA', '#3B0764', '#D8B4FE', '#F1ECF5'),
  P('teal-studio', 'Teal Studio', 'light', '#14B8A6', '#0D9488', '#134E4A', '#5EEAD4', '#04120F'),
  P('midnight-sapphire', 'Midnight Sapphire', 'dark', '#3B82F6', '#2563EB', '#152C5B', '#93C5FD', '#EEF2F8'),
  P('arctic-slate', 'Arctic Slate', 'light', '#64748B', '#475569', '#1E293B', '#CBD5E1', '#0B1220'),
  P('lagoon-mist', 'Lagoon Mist', 'light', '#06B6D4', '#0891B2', '#164E63', '#67E8F9', '#04141A'),

  // ---- neutral / editorial (7) ----
  P('monochrome', 'Monochrome', 'light', '#1F1F1F', '#000000', '#8A8A8A', '#D4D4D4', '#0A0A0A'),
  P('ivory-noir', 'Ivory Noir', 'light', '#2B2B2B', '#111111', '#9C8B7A', '#E5DCD1', '#141414'),
  P('charcoal-gold', 'Charcoal Gold', 'dark', '#D4AF37', '#B8942A', '#2A2A2A', '#EBD68A', '#F4F1EA'),
  P('espresso', 'Espresso', 'light', '#6F4E37', '#553A28', '#241812', '#C9A88C', '#170F0A'),
  P('sage-linen', 'Sage Linen', 'light', '#7C9070', '#5F7255', '#2C3628', '#C3D3B8', '#131A10'),
  P('graphite-mint', 'Graphite Mint', 'dark', '#4ADE80', '#22C55E', '#1F2937', '#BBF7D0', '#ECF2EE'),
  P('bordeaux', 'Bordeaux', 'light', '#7B2436', '#5E1927', '#2A0C13', '#D08D9C', '#1A0509'),
];

/* ---------- lint ---------- */

const problems = [];
const seen = new Set();

for (const t of THEMES) {
  const { primary, secondary, ink, onPrimary, accent } = t.colors;

  if (seen.has(t.id)) problems.push(`${t.id}: duplicate id`);
  seen.add(t.id);

  // Gradient separation: primary -> secondary must stay visibly distinct.
  const p = oklch(primary);
  const s = oklch(secondary);
  const dL = Math.abs(p.L - s.L);
  const dH = hueDelta(p.H, s.H);
  if (dL < 18 && dH < 25) {
    problems.push(
      `${t.id}: gradient too flat (ΔL=${dL.toFixed(1)} need 18, Δhue=${dH.toFixed(1)} need 25)`
    );
  }

  // Body text on the page background must be comfortably readable.
  const surface = t.scheme === 'dark' ? '#101014' : '#FFFFFF';
  const cInk = contrast(ink, surface);
  if (cInk < 7) problems.push(`${t.id}: ink/surface contrast ${cInk.toFixed(2)} < 7`);

  // Button labels on a primary fill.
  const cOn = contrast(onPrimary, primary);
  if (cOn < 4.5) problems.push(`${t.id}: onPrimary/primary contrast ${cOn.toFixed(2)} < 4.5`);

  // Accent is used for highlights over the page background.
  const cAccent = contrast(accent, surface);
  if (cAccent > 1.6 && t.scheme === 'light') {
    // fine — just ensure it isn't so pale it vanishes
  } else if (t.scheme === 'light' && cAccent <= 1.15) {
    problems.push(`${t.id}: accent nearly invisible on surface (${cAccent.toFixed(2)})`);
  }
}

if (THEMES.length !== 30) problems.push(`expected 30 presets, got ${THEMES.length}`);

if (problems.length) {
  console.error('PRESET LINT FAILED:\n' + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`Preset lint passed: ${THEMES.length} presets`);
console.log(`  pink family: ${THEMES.filter((t) => t.id.match(/pink|rose|blush|magenta|fuchsia|plum|cerise|orchid|raspberry|coral/)).length}`);
console.log(`  dark scheme: ${THEMES.filter((t) => t.scheme === 'dark').length}`);

/* ---------- emit ---------- */

const [, , frontendOut, backendOut] = process.argv;

const themeLines = THEMES.map((t) => {
  const c = t.colors;
  return `  {
    id: '${t.id}',
    name: '${t.name}',
    scheme: '${t.scheme}',
    colors: {
      primary: '${c.primary}',
      primaryDeep: '${c.primaryDeep}',
      secondary: '${c.secondary}',
      accent: '${c.accent}',
      ink: '${c.ink}',
      neutral: '${c.neutral}',
      neutralSoft: '${c.neutralSoft}',
      onPrimary: '${c.onPrimary}',
    },
  },`;
}).join('\n');

const frontend = `/**
 * The colour presets a Super Admin can choose from.
 *
 * GENERATED — edit scripts/gen-themes.mjs and re-run \`npm run themes\`.
 * The generator refuses to emit a preset whose primary/secondary are too close
 * to gradient apart (ΔL >= 18 or Δhue >= 25 in OKLCH), whose body text falls
 * below 7:1 on its own surface, or whose button label falls below 4.5:1.
 *
 * Each preset is only these eight values. Everything else — surfaces, borders,
 * alpha tints, gradients — is derived from them once in index.css, which is
 * what makes 30 themes cost 30x8 values instead of 30x341 declarations.
 */

/** @typedef {'light' | 'dark'} Scheme */

export const THEMES = [
${themeLines}
];

export const DEFAULT_THEME_ID = 'signature-pink';

export const THEME_IDS = THEMES.map((t) => t.id);

/** Falls back to the default rather than throwing — an unknown id must never
 *  leave the page unstyled. */
export const getTheme = (id) =>
  THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID);
`;

const backend = `/**
 * Theme ids the API will accept.
 *
 * GENERATED — edit scripts/gen-themes.mjs in the repo root and re-run
 * \`npm run themes\` from the frontend.
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
${THEMES.map((t) => `  "${t.id}",`).join('\n')}
];

/**
 * Typography pairing ids the API will accept.
 *
 * Same rule as the palette: only the id is stored and validated here, while
 * the actual font stacks live in frontend/src/theme/fonts.js — which this
 * generator imports, so the allowlist cannot drift from the real pairings.
 */
export const DEFAULT_FONT_ID = "${DEFAULT_FONT_ID}";

export const FONT_IDS: string[] = [
${FONT_IDS.map((id) => `  "${id}",`).join('\n')}
];

/**
 * Navbar and hero layout ids the API will accept.
 *
 * Same rule again: the id selects a React component that lives in the
 * frontend, so only a value from this list can ever reach a visitor's page.
 */
export const DEFAULT_NAVBAR_ID = "${DEFAULT_NAVBAR_ID}";

export const NAVBAR_IDS: string[] = [
${NAVBAR_IDS.map((id) => `  "${id}",`).join('\n')}
];

export const DEFAULT_HERO_ID = "${DEFAULT_HERO_ID}";

export const HERO_IDS: string[] = [
${HERO_IDS.map((id) => `  "${id}",`).join('\n')}
];
`;

if (frontendOut) { writeFileSync(frontendOut, frontend); console.log('wrote ' + frontendOut); }
if (backendOut) { writeFileSync(backendOut, backend); console.log('wrote ' + backendOut); }
