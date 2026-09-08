/**
 * The typography pairings a Super Admin can choose from.
 *
 * Pairs, not two free dropdowns: a display face and a body face have to agree
 * on more than the admin can reasonably judge from a name — x-height, contrast,
 * how the serif reads at 14px. Every pairing here is one that works as a set,
 * which is the same reason the colour presets ship as presets rather than eight
 * colour pickers.
 *
 * Each entry is only these values. `display` sets --font-display (headings),
 * `body` sets --font-body (everything else), and both are written onto <html>
 * by applyFont() — so all 341 legacy var() references, every Tailwind
 * font-display / font-body utility, and the admin panel follow at once.
 *
 * `google` is the family list for the Google Fonts stylesheet. A pairing with
 * `google: null` uses faces already on the device and loads nothing.
 */

/** @typedef {{ id: string, name: string, note: string, display: string, body: string, google: string[] | null }} FontPairing */

/** @type {FontPairing[]} */
export const FONT_PAIRINGS = [
  {
    id: 'playfair-montserrat',
    name: 'Playfair & Montserrat',
    note: 'The current site pairing — high-contrast serif over a geometric sans.',
    display: "'Playfair Display', Georgia, serif",
    body: "'Montserrat', system-ui, sans-serif",
    google: ['Playfair+Display:wght@400;500;600;700;800;900', 'Montserrat:wght@300;400;500;600;700'],
  },
  {
    id: 'cormorant-inter',
    name: 'Cormorant & Inter',
    note: 'Lighter, more editorial. The serif thins out at display sizes.',
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    google: ['Cormorant+Garamond:wght@400;500;600;700', 'Inter:wght@300;400;500;600;700'],
  },
  {
    id: 'dmserif-dmsans',
    name: 'DM Serif & DM Sans',
    note: 'Designed as a family, so the two faces share proportions.',
    display: "'DM Serif Display', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    google: ['DM+Serif+Display', 'DM+Sans:wght@300;400;500;600;700'],
  },
  {
    id: 'fraunces-worksans',
    name: 'Fraunces & Work Sans',
    note: 'Warmer and softer — the serif has a hand-cut feel.',
    display: "'Fraunces', Georgia, serif",
    body: "'Work Sans', system-ui, sans-serif",
    google: ['Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700', 'Work+Sans:wght@300;400;500;600;700'],
  },
  {
    id: 'marcellus-jost',
    name: 'Marcellus & Jost',
    note: 'Roman capitals over a Futura-like sans. Reads formal.',
    display: "'Marcellus', Georgia, serif",
    body: "'Jost', system-ui, sans-serif",
    google: ['Marcellus', 'Jost:wght@300;400;500;600;700'],
  },
  {
    id: 'libre-source',
    name: 'Baskerville & Source',
    note: 'Libre Baskerville over Source Sans 3 — sturdy and traditional.',
    display: "'Libre Baskerville', Georgia, serif",
    body: "'Source Sans 3', system-ui, sans-serif",
    google: ['Libre+Baskerville:wght@400;700', 'Source+Sans+3:wght@300;400;500;600;700'],
  },
  {
    id: 'italiana-lato',
    name: 'Italiana & Lato',
    note: 'Very high fashion — thin, wide caps. Best with short headlines.',
    display: "'Italiana', Georgia, serif",
    body: "'Lato', system-ui, sans-serif",
    google: ['Italiana', 'Lato:wght@300;400;700'],
  },
  {
    id: 'system',
    name: 'System Default',
    note: 'The device’s own faces. Loads no webfont, so it paints instantly.',
    display:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    body:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    google: null,
  },
];

/** Matches the site as it shipped, so an untouched install looks unchanged. */
export const DEFAULT_FONT_ID = 'playfair-montserrat';

export const FONT_IDS = FONT_PAIRINGS.map((f) => f.id);

/** Never throws: an unknown id falls back to the default. */
export const getFontPairing = (id) =>
  FONT_PAIRINGS.find((f) => f.id === id) ?? FONT_PAIRINGS[0];
