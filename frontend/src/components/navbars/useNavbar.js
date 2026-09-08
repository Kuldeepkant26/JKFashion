import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routePaths.js';

/**
 * The public site's navigation, in one place.
 *
 * Every navbar variant renders the same three destinations; only the styling
 * differs. Keeping the list here means adding a page is one edit rather than
 * four.
 */
export const NAV_LINKS = [
  { label: 'Home', to: ROUTES.HOME },
  { label: 'About', to: ROUTES.ABOUT },
  { label: 'Products', to: ROUTES.PRODUCTS },
];

/**
 * Scroll behaviour shared by every navbar variant.
 *
 * Returns:
 *   scrolled — past the top, so the bar can gain a background/shadow
 *   hidden   — scrolling down and clear of the header, so it can retract
 *
 * The page containers on Home and Products scroll internally on desktop rather
 * than the window, which is why the element being listened to is resolved per
 * route instead of always being `window`.
 */
export const useNavScroll = ({ menuOpen = false } = {}) => {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();

  // Read inside the scroll handler without re-subscribing when it changes.
  const menuOpenRef = useRef(menuOpen);
  useEffect(() => {
    menuOpenRef.current = menuOpen;
    if (menuOpen) setHidden(false);
  }, [menuOpen]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    const homeEl = document.querySelector('.home-page');
    const productsEl = document.querySelector('.interior-design-page');

    let target = window;
    if (!isMobile) {
      if (location.pathname === ROUTES.HOME && homeEl) target = homeEl;
      else if (location.pathname === ROUTES.PRODUCTS && productsEl) target = productsEl;
    }

    const position = () => (target === window ? window.scrollY : target.scrollTop);

    let frame = null;
    let lastY = position();

    // Enough movement to count as intent, so trackpad jitter cannot flip the
    // bar every frame — that reads as a flicker.
    const DEAD_ZONE = 6;
    const OPEN_ABOVE = 90;

    setHidden(false); // a route change starts at the top of the new page

    const update = () => {
      frame = null;
      const y = position();
      setScrolled(y > 20);

      const delta = y - lastY;
      if (Math.abs(delta) > DEAD_ZONE) {
        setHidden(delta > 0 && y > OPEN_ABOVE && !menuOpenRef.current);
        lastY = y;
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    onScroll();
    target.addEventListener('scroll', onScroll, { passive: true });
    // Fallback: the internal container may not exist yet on first paint.
    if (target !== window) window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      target.removeEventListener('scroll', onScroll);
      if (target !== window) window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [location.pathname]);

  return { scrolled, hidden };
};

/**
 * Open/closed state for the mobile menu, with the behaviour a full-screen
 * overlay is expected to have: Escape closes it, the page behind cannot
 * scroll, and navigating closes it.
 */
export const useMobileMenu = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Navigating with the menu open should not leave it covering the new page.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    // Lock the page behind the overlay. Restoring the previous value rather
    // than clearing it avoids clobbering a lock something else set.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return { open, toggle, close };
};
