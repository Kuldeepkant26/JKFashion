import { create } from 'zustand';

/**
 * Presets the owner has hidden from the picker.
 *
 * Server-owned, unlike the theme and font stores: hiding is an editorial
 * decision that must look the same for every admin, so there is deliberately
 * no localStorage fallback here. Before the first fetch resolves the list is
 * empty, which shows every preset — the safe direction to be wrong in, since
 * the alternative would briefly hide presets that are not actually hidden.
 *
 * Nothing on the public site reads this: hiding controls what the picker
 * offers, not what the website renders.
 */
export const useHiddenThemesStore = create((set) => ({
  hidden: [],

  /** Replace the list wholesale — mirrors how the API stores it. */
  set: (hidden) => set({ hidden: Array.isArray(hidden) ? hidden : [] }),
}));
