import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A small stale-while-revalidate cache for admin reads.
 *
 * Every admin tab used to fetch from scratch on mount, so switching between
 * Orders and Companies threw away everything and showed a spinner for data that
 * was seconds old. This keeps the last response per key, hands it back
 * immediately on the next mount, and refreshes behind the already-rendered
 * screen. A mutation calls `invalidate()`, which marks the affected keys stale
 * and refetches them for every mounted subscriber — so a company renamed on one
 * tab shows its new name on the other without a reload, and the list it is
 * rendered in never blinks out to a spinner while that happens.
 *
 * Deliberately not react-query: what is needed here is caching, de-duplication
 * and invalidation by prefix, which is the sixty lines below rather than a
 * dependency and a rewrite of every call site.
 */

/** key -> { data, at, error } */
const cache = new Map();

/** key -> Promise, so N components mounting at once make one request. */
const inflight = new Map();

/** key -> Set<{ rerender, fetcher }>, the mounted hooks to notify and refetch. */
const listeners = new Map();

const notify = (key) => {
  listeners.get(key)?.forEach((entry) => entry.rerender());
};

/**
 * Register a mounted hook against a key.
 *
 * The subscriber hands over its fetcher as well as its re-render callback,
 * because `invalidate` has to be able to REFETCH, not merely repaint. A
 * listener that could only repaint would show whatever invalidation left
 * behind — which is nothing, since invalidation drops the entry.
 */
const subscribe = (key, entry) => {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(entry);

  return () => {
    const set = listeners.get(key);
    if (!set) return;
    set.delete(entry);
    if (!set.size) listeners.delete(key);
  };
};

/**
 * Drop cached entries and make every mounted hook refetch.
 *
 * Matching is by prefix, so `invalidate('orders')` clears every page, filter
 * and search variant of the order list at once — the alternative is the caller
 * reconstructing the exact keys it wants to expire, which is how a stale page
 * two survives a delete on page one.
 */
export const invalidate = (...prefixes) => {
  const keys = new Set();

  for (const prefix of prefixes) {
    for (const key of cache.keys()) if (key.startsWith(prefix)) keys.add(key);
    for (const key of listeners.keys()) if (key.startsWith(prefix)) keys.add(key);
  }

  for (const key of keys) {
    /*
     * The entry is marked stale rather than deleted.
     *
     * Deleting it would take the rendered list off the screen and leave the
     * hook with nothing to show but a spinner, because "no data yet" and "data
     * being refreshed" would look identical. Keeping the last good response and
     * flagging it lets the list stay up, unchanged, until the new one lands.
     */
    const cached = cache.get(key);
    if (cached) cache.set(key, { ...cached, at: 0 });

    // An in-flight request was answering the question as it stood BEFORE this
    // mutation, so its result is already out of date. Forget it, so the
    // refetch below is not de-duplicated against a stale promise.
    inflight.delete(key);
  }

  /*
   * Refetch every invalidated key that something is still mounted against.
   * Nothing else will: the hook's effect is keyed on `key`, which has not
   * changed, so a repaint alone would leave the stale entry in place for ever.
   */
  for (const key of keys) {
    const subscribers = listeners.get(key);

    if (subscribers?.size) {
      // Any subscriber's fetcher will do — they share a key, so they are
      // asking the same question.
      const [first] = subscribers;
      run(key, first.fetcher).catch(() => {});
    } else {
      // Nothing is watching, so there is no one to refetch for. Drop it
      // outright rather than leaving a stale entry to be served on the next
      // mount before its revalidation returns.
      cache.delete(key);
    }

    notify(key);
  }
};

/** Wipe everything — used on sign-out, so the next account starts clean. */
export const clearCache = () => {
  cache.clear();
  inflight.clear();
  for (const key of [...listeners.keys()]) notify(key);
};

const run = (key, fetcher) => {
  if (inflight.has(key)) return inflight.get(key);

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, at: Date.now(), error: null });
      return data;
    })
    .catch((error) => {
      // Cached data is kept on failure: a refresh that fails should leave the
      // last good response on screen with an error beside it, not blank it.
      const previous = cache.get(key);
      cache.set(key, { data: previous?.data, at: previous?.at ?? 0, error });
      throw error;
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
      notify(key);
    });

  inflight.set(key, promise);
  return promise;
};

/**
 * @param key      stable cache key, or null/false to skip fetching entirely
 * @param fetcher  () => Promise<data>
 * @param ttl      ms before a cached entry is refreshed in the background
 */
export function useCachedQuery(key, fetcher, { ttl = 30_000 } = {}) {
  const entry = key ? cache.get(key) : undefined;

  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  /*
   * The fetcher is usually an inline arrow, so it is a new function on every
   * render. Holding it in a ref keeps it out of the effect's dependencies —
   * otherwise the effect would re-run every render and refetch for ever.
   */
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!key) return undefined;

    /*
     * The fetcher is registered indirectly, through the ref. Passing
     * `fetcherRef.current` would freeze whichever closure existed when the
     * effect last ran, and a later `invalidate` would then refetch with stale
     * params captured in it.
     */
    const unsubscribe = subscribe(key, {
      rerender,
      fetcher: () => fetcherRef.current(),
    });

    const cached = cache.get(key);
    const fresh = cached && !cached.error && Date.now() - cached.at < ttl;

    // Fresh enough: render from cache and make no request at all.
    if (!fresh) run(key, fetcherRef.current).catch(() => {});

    return unsubscribe;
  }, [key, ttl, rerender]);

  const refetch = useCallback(() => {
    if (!key) return Promise.resolve(undefined);
    // Not `cache.delete` — that would blank what is on screen for the duration
    // of the request. Dropping the in-flight promise is enough to force a new
    // one; the old data stays visible until it resolves.
    inflight.delete(key);
    return run(key, fetcherRef.current).catch(() => {});
  }, [key]);

  return {
    data: entry?.data,
    error: entry?.error ?? null,
    /*
     * Only a FIRST load blocks. Once there is data, a refresh happens behind
     * it: after a save or a delete the list stays on screen, unchanged, until
     * the new one arrives — rather than being replaced by a spinner, which is
     * what makes a mutation feel like the page has broken.
     */
    loading: Boolean(key) && entry?.data === undefined && !entry?.error,
    /** True while a request is out, whether or not anything is shown yet. */
    validating: Boolean(key) && inflight.has(key),
    refetch,
  };
}

/**
 * Build a stable cache key from params.
 *
 * Keys are sorted so `{page:1, status:'X'}` and `{status:'X', page:1}` are the
 * same key, and empty values are dropped so "no filter" and "filter cleared"
 * do not become two entries holding identical data.
 */
export const cacheKey = (prefix, params = {}) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);

  return parts.length ? `${prefix}:${parts.join('&')}` : `${prefix}:`;
};
