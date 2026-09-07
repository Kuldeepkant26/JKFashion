import { getTheme, DEFAULT_THEME_ID } from './themes.js';

/** Where the visitor's last-seen theme is remembered, so a reload never flashes. */
export const THEME_STORAGE_KEY = 'jk-theme';

/** Layer-1 custom property name for each key in a preset's `colors`. */
const CSS_VAR = {
  primary: '--brand-primary',
  primaryDeep: '--brand-primary-deep',
  secondary: '--brand-secondary',
  accent: '--brand-accent',
  ink: '--brand-ink',
  neutral: '--brand-neutral',
  neutralSoft: '--brand-neutral-soft',
  onPrimary: '--on-primary',
};

/**
 * Paint a theme onto the document.
 *
 * Writes the eight layer-1 variables as inline styles on <html>. Everything
 * else — surfaces, borders, gradients, all 341 legacy var() references, and
 * every Tailwind utility built through `@theme inline` — is derived from those
 * eight and follows automatically.
 *
 * Deliberately framework-free so it can run from main.jsx before React exists,
 * which is what prevents a flash of the wrong palette on reload.
 *
 * Never throws: an unknown id falls back to the default rather than leaving the
 * page unstyled.
 *
 * @param {string | null | undefined} themeId
 * @returns {string} the id actually applied
 */
export const applyTheme = (themeId) => {
  const theme = getTheme(themeId);
  const root = document.documentElement;

  // Suppress transitions for one frame — ~350 tokens changing at once would
  // otherwise animate individually and sweep across the page.
  root.classList.add('theme-switching');

  for (const [key, cssVar] of Object.entries(CSS_VAR)) {
    root.style.setProperty(cssVar, theme.colors[key]);
  }

  root.setAttribute('data-scheme', theme.scheme);
  // Not read by any rule today; it is the escape hatch for the rare case that
  // needs to special-case one preset, and it makes the DOM self-describing.
  root.setAttribute('data-theme', theme.id);

  requestAnimationFrame(() => root.classList.remove('theme-switching'));

  return theme.id;
};

/** Remembered theme, or the default. Storage can throw in private mode. */
export const readStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
};

export const storeTheme = (themeId) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    // Private browsing or blocked storage — the theme still applies for this
    // page view, it just will not be remembered. Not worth surfacing.
  }
};

/** Apply the remembered theme. Called before React mounts. */
export const bootstrapTheme = () => applyTheme(readStoredTheme());
