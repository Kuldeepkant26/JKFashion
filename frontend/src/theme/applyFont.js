import { getFontPairing, DEFAULT_FONT_ID } from './fonts.js';

/** Where the visitor's last-seen pairing is remembered, so a reload never flashes. */
export const FONT_STORAGE_KEY = 'jk-font';

/** id of the <link> this module owns, so it can be swapped rather than stacked. */
const LINK_ID = 'jk-font-link';

/**
 * Point the Google Fonts stylesheet at the pairing's families.
 *
 * One <link> is reused for the life of the page: appending a new one per switch
 * would leave every previously chosen family still downloading and still
 * applying, which is both wasteful and a source of layout shift.
 *
 * `display=swap` keeps text visible while the face loads, so a slow font can
 * never blank the page.
 */
const loadWebfont = (pairing) => {
  const existing = document.getElementById(LINK_ID);

  // System stack needs no network request at all.
  if (!pairing.google) {
    existing?.remove();
    return;
  }

  const href =
    'https://fonts.googleapis.com/css2?' +
    pairing.google.map((f) => `family=${f}`).join('&') +
    '&display=swap';

  const link = existing ?? document.createElement('link');
  if (!existing) {
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
};

/** id of the specimen <link>, kept separate from the one above. */
const SPECIMEN_LINK_ID = 'jk-font-specimens';

/**
 * Load EVERY pairing's faces, so a picker can render each option in its own
 * typeface.
 *
 * Without this the settings cards all look alike: each one correctly asks for
 * its own family, but the browser only holds the faces of the pairing that is
 * currently applied, so the other seven silently fall back to a generic serif.
 *
 * Deliberately a second <link> rather than folding these into the one above:
 * that link is swapped on every preview click, and rebuilding this much larger
 * request each time would re-download the whole set. This one is written once
 * and never touched again.
 *
 * Only the settings page calls this — the public site has no reason to pay for
 * eight font families it will never show.
 *
 * @param {import('./fonts.js').FontPairing[]} pairings
 */
export const preloadSpecimenFonts = (pairings) => {
  if (document.getElementById(SPECIMEN_LINK_ID)) return;

  // A Set because pairings can legitimately share a face.
  const families = [...new Set(pairings.flatMap((p) => p.google ?? []))];
  if (!families.length) return;

  const link = document.createElement('link');
  link.id = SPECIMEN_LINK_ID;
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?' +
    families.map((f) => `family=${f}`).join('&') +
    '&display=swap';
  document.head.appendChild(link);
};

/**
 * Paint a typography pairing onto the document.
 *
 * Writes --brand-font-display and --brand-font-body as inline styles on
 * <html>. Those are the layer-1 variables that index.css's `@theme inline`
 * bridge exposes to Tailwind's `font-display` / `font-body` utilities, and the
 * same ones every stylesheet's `font-family` now points at — so the public
 * site AND the admin panel change together from this one call.
 *
 * Deliberately framework-free so it can run from main.jsx before React exists,
 * which is what prevents a flash of the wrong typeface on reload.
 *
 * Never throws: an unknown id falls back to the default rather than leaving the
 * page in whatever face it inherited.
 *
 * @param {string | null | undefined} fontId
 * @returns {string} the id actually applied
 */
export const applyFont = (fontId) => {
  const pairing = getFontPairing(fontId);
  const root = document.documentElement;

  loadWebfont(pairing);

  root.style.setProperty('--brand-font-display', pairing.display);
  root.style.setProperty('--brand-font-body', pairing.body);

  // Not read by any rule today; it is the escape hatch for the rare case that
  // needs to special-case one pairing, and it makes the DOM self-describing.
  root.setAttribute('data-font', pairing.id);

  return pairing.id;
};

/** Remembered pairing, or the default. Storage can throw in private mode. */
export const readStoredFont = () => {
  try {
    return localStorage.getItem(FONT_STORAGE_KEY) ?? DEFAULT_FONT_ID;
  } catch {
    return DEFAULT_FONT_ID;
  }
};

export const storeFont = (fontId) => {
  try {
    localStorage.setItem(FONT_STORAGE_KEY, fontId);
  } catch {
    // Private browsing or blocked storage — the font still applies for this
    // page view, it just will not be remembered. Not worth surfacing.
  }
};

/** Apply the remembered pairing. Called before React mounts. */
export const bootstrapFont = () => applyFont(readStoredFont());
