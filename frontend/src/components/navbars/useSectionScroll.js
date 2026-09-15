import { useCallback } from 'react';

/**
 * How long the glide takes. Long enough to read as movement between places
 * rather than a jump, short enough not to feel like waiting.
 */
const DURATION_MS = 900;

/**
 * Ease-in-out cubic: slow at both ends, quick through the middle.
 *
 * The browser's own `scroll-behavior: smooth` uses a plainer curve and offers
 * no control over duration, which on a page this tall reads as a lurch. Driving
 * the scroll here is what makes the travel feel deliberate.
 */
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/**
 * The element that actually scrolls.
 *
 * On desktop the home page scrolls an INNER container (.home-page is
 * `height:100vh; overflow-y:scroll`), so scrolling the window does nothing. On
 * mobile that rule is lifted and the window scrolls instead. Resolving it at
 * call time covers both without the caller having to know.
 */
const getScroller = () => {
  const page = document.querySelector('.home-page');

  /*
   * `scrollHeight > clientHeight` is NOT enough to identify the scroller. Below
   * 768px the stylesheet sets .home-page to `height:auto; overflow-y:visible`,
   * and an overflowing element that does not scroll still reports a taller
   * scrollHeight — so that test picks the container on mobile, where the window
   * is what actually moves, and the scroll lands hundreds of pixels off.
   * The computed overflow is the thing that really decides it.
   */
  if (page) {
    const overflowY = getComputedStyle(page).overflowY;
    const scrolls =
      (overflowY === 'auto' || overflowY === 'scroll') &&
      page.scrollHeight > page.clientHeight;
    if (scrolls) return page;
  }

  return document.scrollingElement ?? document.documentElement;
};

/**
 * Sits the section just clear of the fixed navbar rather than under it.
 *
 * Measured from the bar itself rather than hard-coded: the four variants are
 * different heights, and EdgeBar grows a contact strip when the page is at the
 * top. A fixed number would tuck the heading under whichever bar is tallest.
 */
const navClearance = () => {
  const header = document.querySelector('header');
  const height = header?.getBoundingClientRect().height ?? 0;
  return Math.min(height, 120) + 12;
};

const scrollToId = (id) => {
  // A null id means the top of the page — the "Home" link.
  const el = id ? document.getElementById(id) : null;
  if (id && !el) return false;

  const scroller = getScroller();
  const isWindow = scroller === document.scrollingElement || scroller === document.documentElement;

  const start = isWindow ? window.scrollY : scroller.scrollTop;

  // Position relative to the scroller, not the viewport: inside a scrolled
  // container these differ by however far it has already travelled.
  const offset = !el
    ? 0
    : isWindow
      ? el.getBoundingClientRect().top + window.scrollY
      : el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

  const max = scroller.scrollHeight - scroller.clientHeight;
  const target = el ? Math.max(0, Math.min(offset - navClearance(), max)) : 0;
  const distance = target - start;

  if (Math.abs(distance) < 2) return true;

  /*
   * Honour a reduced-motion preference: for someone who gets motion sick, a
   * 900ms glide down a tall page is exactly the thing they turned off.
   */
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    if (isWindow) window.scrollTo(0, target);
    else scroller.scrollTop = target;
    return true;
  }

  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startedAt) / DURATION_MS, 1);
    const next = start + distance * easeInOutCubic(progress);

    if (isWindow) window.scrollTo(0, next);
    else scroller.scrollTop = next;

    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
  return true;
};

/**
 * Scroll the page to a section by id, smoothly.
 *
 * The site is one page, so every navigation is a scroll rather than a route
 * change. Returns a click handler ready to hand to an anchor.
 */
export const useSectionScroll = (id, { onNavigate } = {}) =>
  useCallback(
    (e) => {
      e?.preventDefault();
      onNavigate?.();

      /*
       * The section may not be mounted yet on a cold load — the home page is
       * lazy in places. Poll a few frames rather than guessing a delay, which
       * is either too short on a slow device or a visible pause on a fast one.
       */
      let attempts = 0;
      const tryScroll = () => {
        if (scrollToId(id) || attempts > 40) return;
        attempts += 1;
        requestAnimationFrame(tryScroll);
      };
      requestAnimationFrame(tryScroll);
    },
    [id, onNavigate]
  );

export { scrollToId };
