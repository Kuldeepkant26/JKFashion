import { useEffect, useState } from 'react';
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
    setActiveIndex(Math.max(0, Math.min(last, next)));
  };

  return (
    <div className="closeup">
      <div className="closeup__inner">
        {/* ------------------------------------------------------- grid */}
        <div
          className="closeup__grid"
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
