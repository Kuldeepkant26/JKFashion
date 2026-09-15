import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routePaths.js';
import { GALLERY_SECTION_ID } from '../RackGallery.jsx';
import { PROCESS_SECTION_ID } from '../HowWeWork.jsx';

/**
 * The public site's navigation, in one place.
 *
 * The site is a single page, so these are sections rather than routes: each
 * link scrolls rather than navigates. `id: null` means the top of the page.
 *
 * Every navbar variant renders the same destinations; only the styling differs.
 * Keeping the list here means adding one is a single edit rather than four.
 */
export const NAV_LINKS = [
  { label: 'Home', id: null },
  { label: 'Gallery', id: GALLERY_SECTION_ID },
  { label: 'Our Process', id: PROCESS_SECTION_ID },
];

/**
 * Which nav link to highlight, based on what is currently on screen.
 *
 * An IntersectionObserver rather than measuring on every scroll event: the
 * browser does the work off the main thread, and the sections are tall enough
 * that a threshold near the top of the viewport reads correctly without any
 * tuning per section.
 *
 * Returns the active section id, or null while the hero is in view (Home).
 */
export const useActiveSection = () => {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.id).filter(Boolean);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!elements.length) return undefined;

    const visible = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        });

        // The most-visible section wins, so a short one scrolling past a tall
        // one cannot steal the highlight.
        let best = null;
        let bestRatio = 0;
        visible.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        });

        setActiveId(best);
      },
      {
        // Ignore the top strip under the fixed navbar, and only count a section
        // once a real part of it is showing.
        rootMargin: '-15% 0px -50% 0px',
        threshold: [0.1, 0.3, 0.5],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return activeId;
};

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

    let target = window;
    if (!isMobile && homeEl) target = homeEl;

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
