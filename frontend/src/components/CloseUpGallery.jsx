import { useCallback, useEffect, useRef, useState } from 'react';
import * as galleryApi from '../api/gallery.api.js';
import { useZoomLens } from './useZoomLens.js';
import '../css/CloseUpGallery.css';

const LENS_SIZE = 132; // must match .closeup__lens in the CSS
const ZOOM = 3.2;      // matches the rack viewer above it

/** Live boolean for a media query. Gates the lens off touch and reduced motion. */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const onChange = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

/**
 * A second look at the range, sharing the Look Closer heading above it.
 *
 * Deliberately has no heading of its own: it reads as the lower half of that
 * section rather than a new one, which is why it carries the same lens
 * behaviour and the same viewer proportions as the rack.
 *
 * The images come from the admin panel rather than the codebase, so this
 * renders nothing at all when the gallery is empty — an empty grid with a
 * placeholder would look broken on a live site.
 */
export default function CloseUpGallery() {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const lensCapable = useMediaQuery('(min-width: 900px)') && !reduceMotion;

  useEffect(() => {
    let cancelled = false;

    galleryApi
      .list()
      .then((data) => {
        if (cancelled) return;
        setItems(data?.items ?? []);
      })
      .catch(() => {
        // The rest of the page is unaffected, and a visitor cannot act on a
        // failed fetch — so it stays silent and the section simply does not
        // render.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const active = items[activeIndex];

  /*
   * The grid scrolls sideways past six images, so moving the selection with the
   * arrow keys has to bring the new thumbnail into view — otherwise focus lands
   * on a button the visitor cannot see.
   */
  const thumbRefs = useRef([]);
  const gridRef = useRef(null);

  /**
   * Whether there is anything left to scroll to, in each direction.
   *
   * Drives the arrow's visibility rather than just its enabled state: an arrow
   * that is always present but does nothing at the end of the row is worse
   * than no arrow at all.
   */
  const [scroll, setScroll] = useState({ canPrev: false, canNext: false });

  const measure = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;

    // 2px of slack: sub-pixel widths mean scrollLeft rarely reaches the exact
    // maximum, which would leave the arrow showing with nowhere to go.
    setScroll({
      canPrev: el.scrollLeft > 2,
      canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }, []);

  // Re-measure whenever the content or the box changes: images arriving late
  // and a window resize both alter whether there is an overflow.
  useEffect(() => {
    measure();
    const el = gridRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, items.length]);

  /** Advance by one full column-set, so a click lands on a clean edge. */
  const scrollByPage = (direction) => {
    const el = gridRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  const select = (index) => {
    setActiveIndex(index);
    const el = thumbRefs.current[index];
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };

  const { frameProps, lensRef, onImageLoad } = useZoomLens({
    src: active?.url,
    size: LENS_SIZE,
    zoom: ZOOM,
    fit: 'cover',
    enabled: lensCapable,
  });

  // Nothing to show, or not fetched yet. Rendering a skeleton here would
  // reserve space for a section that may legitimately never appear.
  if (!loaded || !items.length) return null;

  const onGridKeyDown = (event) => {
    const last = items.length - 1;
    let next = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = activeIndex + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = activeIndex - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;

    event.preventDefault();
    select(Math.max(0, Math.min(last, next)));
  };

  return (
    <div className="closeup">
      <div className="closeup__inner">
        {/* ------------------------------------------------------- grid */}
        <div className="closeup__grid-wrap">
          <div
            className="closeup__grid"
            ref={gridRef}
            onScroll={measure}
            role="tablist"
            aria-label="More from the range"
            aria-orientation="horizontal"
            onKeyDown={onGridKeyDown}
          >
            {items.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={item._id ?? item.url}
                  ref={(el) => {
                    thumbRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="closeup-viewer"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveIndex(index)}
                  className={`closeup__thumb ${isActive ? 'closeup__thumb--active' : ''}`}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="closeup__thumb-img"
                  />
                  <span className="closeup__thumb-veil" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          {/*
            Only rendered when there is somewhere to go. The back arrow appears
            once you have scrolled, so it never sits there disabled on load.
          */}
          {scroll.canPrev ? (
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              aria-label="Show previous images"
              className="closeup__nav closeup__nav--prev"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M10 3 5 8l5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}

          {scroll.canNext ? (
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              aria-label="Show more images"
              className="closeup__nav closeup__nav--next"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M6 3l5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>

        {/* ----------------------------------------------------- viewer */}
        <div className="closeup__viewer" id="closeup-viewer" role="tabpanel">
          <div className="closeup__frame" {...frameProps}>
            {/*
              Only the selected image is mounted, unlike the rack above: that
              one cross-fades between four fixed photographs, while this list is
              admin-managed and could run to dozens.
            */}
            <img
              key={active.url}
              src={active.url}
              alt={active.title}
              onLoad={onImageLoad}
              className="closeup__frame-img"
            />

            <div className="closeup__lens" ref={lensRef} aria-hidden="true" />

            {lensCapable ? (
              <span className="closeup__hint" aria-hidden="true">
                Hover to magnify
              </span>
            ) : null}
          </div>

          {active.title || active.caption ? (
            <div className="closeup__meta">
              {active.title ? <h3 className="closeup__name">{active.title}</h3> : null}
              {active.caption ? <p className="closeup__caption">{active.caption}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      <p className="closeup__sr-status" role="status" aria-live="polite">
        {active.title} — image {activeIndex + 1} of {items.length}
      </p>
    </div>
  );
}
