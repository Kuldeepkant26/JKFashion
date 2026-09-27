import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/** How far the fade reaches in from an edge that has more tabs past it. */
const FADE = 28;

/**
 * A mask that fades whichever edge has more tabs beyond it. Masking the strip
 * itself, rather than laying a gradient over it, means the fade works on any
 * background the section happens to sit on.
 */
const fadeMask = ({ start, end }) => {
  if (!start && !end) return undefined;

  const from = start ? `transparent 0, #000 ${FADE}px` : '#000 0';
  const to = end ? `#000 calc(100% - ${FADE}px), transparent 100%` : '#000 100%';
  const gradient = `linear-gradient(to right, ${from}, ${to})`;

  return { maskImage: gradient, WebkitMaskImage: gradient };
};

/**
 * The tab strip a section's sub-pages hang off.
 *
 * Extracted once a third section needed it — settings, orders and the stock
 * ledger were carrying byte-identical markup, which is three places for a
 * focus ring or a spacing tweak to go out of step.
 *
 * It scrolls rather than wraps: a tab bar that reflows onto two lines stops
 * reading as one control. On a phone it is wider than the screen, so two
 * things keep that honest: the tab you are on is scrolled into view — it must
 * never be the one cut off — and an edge with more tabs past it fades out,
 * which says "this scrolls" without a word.
 *
 * @param tabs  [{ to, label }] — `to` is an absolute route from ROUTES
 * @param label accessible name for the nav landmark, e.g. "Inventory sections"
 */
export default function TabBar({ tabs, label }) {
  const scroller = useRef(null);
  const { pathname } = useLocation();
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;

    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  /*
   * Bring the current tab into view, horizontally only — `scrollIntoView`
   * would also scroll the page, jumping it on every tab change.
   */
  useEffect(() => {
    const el = scroller.current;
    const active = el?.querySelector('[aria-current="page"]');

    if (el && active) {
      const box = el.getBoundingClientRect();
      const tab = active.getBoundingClientRect();
      if (tab.left < box.left) el.scrollLeft -= box.left - tab.left + FADE;
      else if (tab.right > box.right) el.scrollLeft += tab.right - box.right + FADE;
    }

    measure();
  }, [pathname, measure]);

  /* Re-measure when the strip's width changes — a rotation, a resized window. */
  useEffect(() => {
    const el = scroller.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div
      ref={scroller}
      onScroll={measure}
      style={fadeMask(edges)}
      className="-mx-1 overflow-x-auto pb-1"
    >
      <nav
        className="flex min-w-max gap-1 rounded-2xl bg-brand-ink/4 p-1"
        aria-label={label}
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition-colors
               focus-visible:outline-2 focus-visible:outline-offset-2
               focus-visible:outline-brand-pink ${
                 isActive
                   ? 'bg-surface-card text-brand-ink shadow-sm'
                   : 'text-brand-ink/55 hover:text-brand-ink'
               }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
