import { useEffect } from 'react';
import * as themeApi from '../api/theme.api.js';
import { useThemeStore } from './useThemeStore.js';
import { useFontStore } from './useFontStore.js';
import { useHiddenThemesStore } from './useHiddenThemesStore.js';
import { useLayoutStore } from './useLayoutStore.js';

/**
 * Reconciles the locally-remembered appearance with the server's.
 *
 * main.jsx has already painted the cached theme and typeface, so this only
 * matters when the owner changed either since this visitor's last load — and
 * on a first-ever visit, where the request resolves behind the splash screen.
 *
 * Renders nothing and never blocks paint: if the API is unreachable the site
 * keeps the cached (or default) appearance rather than showing a white screen.
 */
export default function ThemeBootstrap() {
  const commitTheme = useThemeStore((s) => s.commit);
  const commitFont = useFontStore((s) => s.commit);
  const setHidden = useHiddenThemesStore((s) => s.set);
  const commitNavbar = useLayoutStore((s) => s.commitNavbar);
  const commitHero = useLayoutStore((s) => s.commitHero);

  useEffect(() => {
    let cancelled = false;

    themeApi
      .get()
      .then((data) => {
        if (cancelled || !data) return;
        if (data.themeId) commitTheme(data.themeId);
        if (data.fontId) commitFont(data.fontId);
        if (data.navbarId) commitNavbar(data.navbarId);
        if (data.heroId) commitHero(data.heroId);
        // Absent on an older API build; an empty list simply shows everything.
        setHidden(data.hiddenThemeIds ?? []);
      })
      .catch(() => {
        // Offline or API down — the cached appearance stands. Not worth
        // surfacing to a visitor who cannot act on it.
      });

    return () => {
      cancelled = true;
    };
  }, [commitTheme, commitFont, commitNavbar, commitHero, setHidden]);

  return null;
}
