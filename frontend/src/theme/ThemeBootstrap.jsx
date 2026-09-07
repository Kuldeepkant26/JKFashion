import { useEffect } from 'react';
import * as themeApi from '../api/theme.api.js';
import { useThemeStore } from './useThemeStore.js';

/**
 * Reconciles the locally-remembered theme with the server's.
 *
 * main.jsx has already painted the cached theme, so this only matters when the
 * owner changed it since this visitor's last load — and on a first-ever visit,
 * where the request resolves behind the splash screen.
 *
 * Renders nothing and never blocks paint: if the API is unreachable the site
 * keeps the cached (or default) palette rather than showing a white screen.
 */
export default function ThemeBootstrap() {
  const commit = useThemeStore((s) => s.commit);

  useEffect(() => {
    let cancelled = false;

    themeApi
      .get()
      .then((data) => {
        if (!cancelled && data?.themeId) commit(data.themeId);
      })
      .catch(() => {
        // Offline or API down — the cached theme stands. Not worth surfacing
        // to a visitor who cannot act on it.
      });

    return () => {
      cancelled = true;
    };
  }, [commit]);

  return null;
}
