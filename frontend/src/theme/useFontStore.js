import { create } from 'zustand';
import { applyFont, readStoredFont, storeFont } from './applyFont.js';

/**
 * Active typography pairing, as React sees it.
 *
 * Deliberately NOT in useAppStore's persist(): the pairing is written to its
 * own localStorage key by applyFont() and read back before React mounts, which
 * is what prevents a flash of the wrong typeface. Persisting it here too would
 * create a second source of truth that rehydrates a frame later.
 *
 * `saved` tracks what the server has, so the settings page can tell a local
 * preview apart from a persisted choice and offer Save only when they differ.
 *
 * Mirrors useThemeStore exactly — the two settings behave identically from the
 * admin's point of view, so they should not need different mental models.
 */
export const useFontStore = create((set) => ({
  fontId: readStoredFont(),
  saved: readStoredFont(),

  /** Preview locally without persisting — used by the settings cards. */
  preview: (fontId) => set({ fontId: applyFont(fontId) }),

  /** Apply and remember, after the server confirms or on initial sync. */
  commit: (fontId) => {
    const applied = applyFont(fontId);
    storeFont(applied);
    set({ fontId: applied, saved: applied });
  },

  /** Drop an unsaved preview and return to the server's pairing. */
  revert: () => set((s) => ({ fontId: applyFont(s.saved) })),
}));
