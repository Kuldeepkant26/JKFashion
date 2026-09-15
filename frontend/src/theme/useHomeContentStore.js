import { create } from 'zustand';
import { HOME_FALLBACK } from '../data/homeFallback.js';

const KEY = 'jk-home-content';

/** Storage can throw in private mode; a missing value is not an error. */
const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const write = (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private browsing or blocked storage — the content still applies for this
    // page view, it just will not be remembered. Not worth surfacing.
  }
};

/**
 * Merge a server response over the fallback.
 *
 * `image.url` is flattened to `imageSrc` here so no variant has to know whether
 * the picture came from Cloudinary or the bundle. A hero with no uploaded image
 * falls back to the bundled cut-out rather than rendering a broken <img>.
 */
const merge = (data) => ({
  hero: {
    ...HOME_FALLBACK.hero,
    ...data?.hero,
    imageSrc: data?.hero?.image?.url || HOME_FALLBACK.hero.imageSrc,
  },
});

/**
 * The hero content the site renders.
 *
 * Seeded from the cache (or the built-in fallback) rather than empty, so the
 * first paint is complete content and not a placeholder that shifts when the
 * request lands. That matters here more than anywhere else on the site: this is
 * the headline, above the fold.
 *
 * The admin panel deliberately does NOT read this store — it fetches its own
 * copy, so an editor always shows the server's truth.
 */
export const useHomeContentStore = create((set) => ({
  ...merge(read()),

  /** Apply and remember, after the server responds. */
  commit: (data) => {
    write(data);
    set(merge(data));
  },
}));
