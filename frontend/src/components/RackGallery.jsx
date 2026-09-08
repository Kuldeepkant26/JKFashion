import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { garments } from '../data/garments';
import '../css/RackGallery.css';

/*
 * Magnification inside the lens. The source is the 1400px `-full.jpg`, and the
 * frame renders it at roughly 460px, so the file already holds ~3x more detail
 * than the frame shows — 3.2x spends that headroom without resampling past it.
 */
const ZOOM = 3.2;
const LENS = 132;   // must match .rack-gallery__lens in the CSS

/** Media query as a live boolean. Used for the lens and reduced-motion gates. */
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

export default function RackGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);

  // Hold the whole section back until it is near the viewport: the four
  // photographs are the heaviest thing on the page and it sits deep in the scroll.
  const { ref: sectionRef, inView } = useInView({
    threshold: 0,
    rootMargin: '300px',
    triggerOnce: true,
  });

  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const lensCapable = useMediaQuery('(min-width: 900px)') && !reduceMotion;

  const frameRef = useRef(null);
  const lensRef = useRef(null);
  const itemRefs = useRef([]);
  const rafRef = useRef(0);
  // naturalWidth/Height read on load; reading at pointer-move gives 0 on an
  // image that has not decoded yet, which throws the lens into a corner.
  const naturalRef = useRef({});
  const lensPrimed = useRef(false);
  const closeRef = useRef(null);
  const lastFocusRef = useRef(null);

  const active = garments[activeIndex];

  const select = useCallback((index) => {
    setActiveIndex(Math.max(0, Math.min(garments.length - 1, index)));
  }, []);

  /* ------------------------------------------------------------------ lens */

  const positionLens = useCallback((clientX, clientY) => {
    const frame = frameRef.current;
    const lens = lensRef.current;
    if (!frame || !lens) return;

    const nat = naturalRef.current[active.id];
    if (!nat?.w) return; // not decoded yet

    const rect = frame.getBoundingClientRect();

    // Keep the circle wholly inside the frame rather than letting half of it
    // hang over the page background.
    const half = LENS / 2;
    const x = Math.max(half, Math.min(rect.width - half, clientX - rect.left));
    const y = Math.max(half, Math.min(rect.height - half, clientY - rect.top));

    // The frame is square and the photographs are portrait, so the <img> is
    // object-fit: cover. The lens has to reproduce that same crop or the
    // magnified patch will not line up with what is under the cursor.
    const scale = Math.max(rect.width / nat.w, rect.height / nat.h);
    const dispW = nat.w * scale;
    const dispH = nat.h * scale;
    const offX = (rect.width - dispW) / 2;
    const offY = (rect.height - dispH) / 2;

    // Written straight to the node. Routing this through state would re-render
    // the section — including every stacked image — on every pointer move.
    lens.style.left = `${x - half}px`;
    lens.style.top = `${y - half}px`;
    lens.style.backgroundSize = `${dispW * ZOOM}px ${dispH * ZOOM}px`;
    lens.style.backgroundPosition =
      `${-((x - offX) * ZOOM - half)}px ${-((y - offY) * ZOOM - half)}px`;
  }, [active.id]);

  const schedule = useCallback((clientX, clientY) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => positionLens(clientX, clientY));
  }, [positionLens]);

  const showLens = useCallback(() => {
    const lens = lensRef.current;
    if (!lens) return;
    // Deferred to first interaction: setting it at mount forces a second full
    // decode of an image already on screen.
    if (!lensPrimed.current) {
      lens.style.backgroundImage = `url(${active.media.full})`;
      lensPrimed.current = true;
    }
    lens.style.opacity = '1';
  }, [active.media.full]);

  const hideLens = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (lensRef.current) lensRef.current.style.opacity = '0';
  }, []);

  // Re-point the lens when the selection changes, but only if it was already
  // primed — otherwise this would defeat the deferred load above.
  useEffect(() => {
    if (lensPrimed.current && lensRef.current) {
      lensRef.current.style.backgroundImage = `url(${active.media.full})`;
    }
  }, [active.media.full]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /* -------------------------------------------------------------- keyboard */

  const onRackKeyDown = (event) => {
    const last = garments.length - 1;
    let next = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = activeIndex + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = activeIndex - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;

    event.preventDefault();
    // Clamped rather than wrapping: jumping from the last garment back to the
    // first is disorienting when the items are laid out in space.
    const clamped = Math.max(0, Math.min(last, next));
    select(clamped);
    itemRefs.current[clamped]?.focus();
  };

  /* ------------------------------------------------------- detail overlay */

  useEffect(() => {
    if (!detailOpen) return undefined;

    lastFocusRef.current = document.activeElement;
    closeRef.current?.focus();

    const onKey = (e) => { if (e.key === 'Escape') setDetailOpen(false); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      // Send focus back where it came from, or the page loses its place.
      lastFocusRef.current?.focus?.();
    };
  }, [detailOpen]);

  return (
    <section
      className="rack-gallery"
      ref={sectionRef}
      aria-labelledby="rack-gallery-title"
      /* The rail's length is derived from the number of cards, so the array
         can grow or shrink without the CSS falling out of step. */
      style={{ '--rg-count': garments.length }}
    >
      <div className="rack-gallery__header">
        <span className="rack-gallery__label">The Range</span>
        <h2 className="rack-gallery__title" id="rack-gallery-title">
          Look Closer
        </h2>
        <p className="rack-gallery__intro">
          Pick a piece from the rail. Hover the frame to bring the embroidery up close —
          the thread, the ground and the repeat, at the scale a buyer would inspect them.
        </p>
      </div>

      <div className="rack-gallery__inner">
        {/* ------------------------------------------------------------ rack */}
        <div className="rack-gallery__rack">
          <div className="rack-gallery__rail" aria-hidden="true" />

          <div
            className="rack-gallery__items"
            role="tablist"
            aria-label="Garment range"
            aria-orientation="horizontal"
            onKeyDown={onRackKeyDown}
          >
            {garments.map((garment, index) => {
              const offset = index - activeIndex;
              const isActive = index === activeIndex;
              /*
               * Rank is the card's slot on the rail: the selected one takes
               * the front, the rest queue behind it in their original order.
               *
               * It MUST be a permutation of 0..n-1. An earlier version used
               * `index < active ? index + 1 : index - active`, which repeats a
               * value for any middle selection (active=1 gives 1,0,1,2) — two
               * cards landed in the same slot and one vanished behind the
               * other, which is why the rack sometimes showed three cards.
               */
              const rank = index === activeIndex
                ? 0
                : index < activeIndex
                  ? index + 1
                  : index;

              return (
                <button
                  key={garment.id}
                  ref={(node) => { itemRefs.current[index] = node; }}
                  type="button"
                  role="tab"
                  id={`rack-tab-${garment.id}`}
                  aria-selected={isActive}
                  aria-controls="rack-gallery-panel"
                  tabIndex={isActive ? 0 : -1}
                  className={`rack-gallery__item ${isActive ? 'rack-gallery__item--active' : ''}`}
                  style={{ '--offset': offset, '--abs': Math.abs(offset), '--i': index, '--rank': rank }}
                  onClick={() => select(index)}
                >
                  <span className="rack-gallery__hanger" aria-hidden="true" />

                  <span className="rack-gallery__card">
                    {inView ? (
                      <img
                        className="rack-gallery__photo"
                        src={garment.media.card}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={{ objectPosition: `${garment.crop.x}% ${garment.crop.y}%` }}
                      />
                    ) : null}
                    <span className="rack-gallery__sheen" aria-hidden="true" />
                  </span>

                  <span className="rack-gallery__caption">
                    <span
                      className="rack-gallery__swatch"
                      style={{ background: garment.swatch }}
                      aria-hidden="true"
                    />
                    <span className="rack-gallery__caption-text">{garment.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------------------------------------------------- viewer */}
        <div
          className="rack-gallery__viewer"
          id="rack-gallery-panel"
          role="tabpanel"
          aria-labelledby={`rack-tab-${active.id}`}
        >
          <div
            className="rack-gallery__frame"
            ref={frameRef}
            onMouseEnter={lensCapable ? showLens : undefined}
            onMouseMove={lensCapable ? (e) => schedule(e.clientX, e.clientY) : undefined}
            onMouseLeave={lensCapable ? hideLens : undefined}
            onTouchStart={lensCapable ? (e) => {
              showLens();
              schedule(e.touches[0].clientX, e.touches[0].clientY);
            } : undefined}
            onTouchMove={lensCapable ? (e) => {
              schedule(e.touches[0].clientX, e.touches[0].clientY);
            } : undefined}
            onTouchEnd={lensCapable ? hideLens : undefined}
          >
            {/* All frames stay mounted and cross-fade. Keying on the active
                index would re-decode the photograph on every selection. */}
            {garments.map((garment, index) => (
              <img
                key={garment.id}
                className={`rack-gallery__frame-photo ${
                  index === activeIndex ? 'rack-gallery__frame-photo--active' : ''
                }`}
                src={inView ? garment.media.full : undefined}
                alt={garment.alt}
                decoding="async"
                loading={index === 0 ? 'eager' : 'lazy'}
                onLoad={(e) => {
                  naturalRef.current[garment.id] = {
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  };
                }}
              />
            ))}

            {lensCapable ? (
              <div className="rack-gallery__lens" ref={lensRef} aria-hidden="true" />
            ) : (
              <button
                type="button"
                className="rack-gallery__detail-btn"
                onClick={() => setDetailOpen(true)}
              >
                View detail
              </button>
            )}
          </div>

          <div className="rack-gallery__meta">
            <span className="rack-gallery__category">{active.category}</span>
            <h3 className="rack-gallery__name">{active.title}</h3>
            <p className="rack-gallery__subtitle">{active.subtitle}</p>
            <p className="rack-gallery__description">{active.description}</p>
          </div>
        </div>
      </div>

      {/* Announces the change for screen readers, which cannot see the rack move. */}
      <p className="rack-gallery__sr-status" role="status" aria-live="polite">
        {active.title}, {active.category}
      </p>

      {detailOpen ? (
        <div
          className="rack-gallery__overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} — full view`}
          onClick={() => setDetailOpen(false)}
        >
          <button
            type="button"
            className="rack-gallery__overlay-close"
            aria-label="Close full view"
            onClick={() => setDetailOpen(false)}
            ref={closeRef}
          >
            ×
          </button>
          <img src={active.media.full} alt={active.alt} />
        </div>
      ) : null}
    </section>
  );
}
