import { create } from 'zustand';
import { applyTheme, readStoredTheme, storeTheme } from './applyTheme.js';

/**
 * Active theme, as React sees it.
 *
 * Deliberately NOT in useAppStore's persist(): the theme is written to its own
 * localStorage key by applyTheme() and read back before React mounts, which is
 * what prevents a flash of the wrong palette. Persisting it here too would
 * create a second source of truth that rehydrates a frame later.
 *
 * `saved` tracks what the server has, so the settings page can tell a local
 * preview apart from a persisted choice and offer Save only when they differ.
 */
export const useThemeStore = create((set) => ({
  themeId: readStoredTheme(),
  saved: readStoredTheme(),

  /** Preview locally without persisting — used by the settings swatches. */
  preview: (themeId) => set({ themeId: applyTheme(themeId) }),

  /** Apply and remember, after the server confirms or on initial sync. */
  commit: (themeId) => {
    const applied = applyTheme(themeId);
    storeTheme(applied);
    set({ themeId: applied, saved: applied });
  },

  /** Drop an unsaved preview and return to the server's theme. */
  revert: () => set((s) => ({ themeId: applyTheme(s.saved) })),
}));
