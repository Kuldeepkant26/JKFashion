import { create } from 'zustand';
import { DEFAULT_NAVBAR_ID, DEFAULT_HERO_ID } from './layouts.js';

const NAVBAR_KEY = 'jk-navbar';
const HERO_KEY = 'jk-hero';

/** Storage can throw in private mode; a missing value is not an error. */
const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing or blocked storage — the choice still applies for this
    // page view, it just will not be remembered. Not worth surfacing.
  }
};

/**
 * Which navbar and hero the site renders.
 *
 * Unlike the palette and typography, there is nothing to paint onto <html>
 * here: the value selects a React component, so it is read during render
 * rather than applied as a side effect. It is still cached in localStorage for
 * the same reason those are — so a reload draws the right layout immediately
 * instead of flashing the default while the API call is in flight.
 *
 * `saved` tracks what the server has, so the settings page can tell a local
 * preview apart from a persisted choice and offer Save only when they differ.
 */
export const useLayoutStore = create((set) => ({
  navbarId: read(NAVBAR_KEY, DEFAULT_NAVBAR_ID),
  heroId: read(HERO_KEY, DEFAULT_HERO_ID),
  savedNavbarId: read(NAVBAR_KEY, DEFAULT_NAVBAR_ID),
  savedHeroId: read(HERO_KEY, DEFAULT_HERO_ID),

  /** Preview locally without persisting — used by the settings cards. */
  previewNavbar: (navbarId) => set({ navbarId }),
  previewHero: (heroId) => set({ heroId }),

  /** Apply and remember, after the server confirms or on initial sync. */
  commitNavbar: (navbarId) => {
    write(NAVBAR_KEY, navbarId);
    set({ navbarId, savedNavbarId: navbarId });
  },
  commitHero: (heroId) => {
    write(HERO_KEY, heroId);
    set({ heroId, savedHeroId: heroId });
  },

  /** Drop unsaved previews and return to the server's choice. */
  revert: () =>
    set((s) => ({ navbarId: s.savedNavbarId, heroId: s.savedHeroId })),
}));
