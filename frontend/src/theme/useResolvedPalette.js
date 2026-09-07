import { useEffect, useState } from 'react';
import { useThemeStore } from './useThemeStore.js';

const VARS = {
  primary: '--brand-primary',
  primaryDeep: '--brand-primary-deep',
  accent: '--brand-accent',
  ink: '--brand-ink',
  onPrimary: '--on-primary',
  surfaceCard: '--surface-card',
};

const read = () => {
  const style = getComputedStyle(document.documentElement);
  const out = {};
  for (const [key, cssVar] of Object.entries(VARS)) {
    out[key] = style.getPropertyValue(cssVar).trim();
  }
  return out;
};

/**
 * The active palette as resolved hex strings.
 *
 * Needed for the few places that cannot use a CSS variable: Recharts writes
 * its colours into SVG presentation attributes (stroke, fill on <stop>), and
 * those do not accept var() reliably across browsers. Everything that CAN take
 * a variable should use one instead of this hook.
 *
 * Re-reads whenever the theme changes, so charts repaint with the rest of the
 * panel rather than keeping the previous palette until a reload.
 */
export const useResolvedPalette = () => {
  const themeId = useThemeStore((s) => s.themeId);
  const [palette, setPalette] = useState(read);

  useEffect(() => {
    // applyTheme() writes the variables synchronously, but it also toggles a
    // class for one frame; reading on the next frame keeps this off the
    // critical path and guarantees the new values are committed.
    const id = requestAnimationFrame(() => setPalette(read()));
    return () => cancelAnimationFrame(id);
  }, [themeId]);

  return palette;
};
