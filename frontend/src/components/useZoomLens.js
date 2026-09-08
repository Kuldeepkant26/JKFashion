import { useCallback, useEffect, useRef } from 'react';

/**
 * The circular magnifier shared by the rack viewer and the gallery below it.
 *
 * Extracted from RackGallery so the two behave identically — the same circle,
 * the same magnification, the same edge handling. Duplicating this was the
 * alternative, and two copies of pointer maths drift the moment one is tweaked.
 *
 * The lens is driven by writing styles straight to the node. Routing pointer
 * moves through React state would re-render the whole section on every frame,
 * which is exactly what a 60fps interaction cannot afford.
 *
 * @param {object}  options
 * @param {string}  options.src       full-resolution image the lens magnifies
 * @param {number}  options.size      diameter in px; must match the CSS
 * @param {number}  options.zoom      magnification factor
 * @param {'cover'|'contain'} options.fit  how the <img> is fitted in its frame
 * @param {boolean} options.enabled   false disables it (touch, reduced motion)
 */
export const useZoomLens = ({ src, size = 132, zoom = 3.2, fit = 'cover', enabled = true }) => {
  const frameRef = useRef(null);
  const lensRef = useRef(null);
  const rafRef = useRef(0);

  /** Natural dimensions, keyed by src, so the crop can be reproduced exactly. */
  const naturalRef = useRef({});

  /** The lens only loads its copy of the image once the pointer arrives. */
  const primedRef = useRef(false);

  const onImageLoad = useCallback((event) => {
    const img = event.currentTarget;
    naturalRef.current[img.src] = { w: img.naturalWidth, h: img.naturalHeight };
  }, []);

  const position = useCallback(
    (clientX, clientY) => {
      const frame = frameRef.current;
      const lens = lensRef.current;
      if (!frame || !lens || !src) return;

      const nat = naturalRef.current[new URL(src, window.location.href).href]
        ?? naturalRef.current[src];
      if (!nat?.w) return; // not decoded yet

      const rect = frame.getBoundingClientRect();

      // Keep the circle wholly inside the frame rather than letting half of it
      // hang over the page background.
      const half = size / 2;
      const x = Math.max(half, Math.min(rect.width - half, clientX - rect.left));
      const y = Math.max(half, Math.min(rect.height - half, clientY - rect.top));

      /*
       * Reproduce the <img>'s own fit, or the magnified patch will not line up
       * with what is under the cursor: `cover` scales to the larger ratio and
       * crops, `contain` scales to the smaller and letterboxes.
       */
      const ratio = fit === 'contain'
        ? Math.min(rect.width / nat.w, rect.height / nat.h)
        : Math.max(rect.width / nat.w, rect.height / nat.h);

      const dispW = nat.w * ratio;
      const dispH = nat.h * ratio;
      const offX = (rect.width - dispW) / 2;
      const offY = (rect.height - dispH) / 2;

      lens.style.left = `${x - half}px`;
      lens.style.top = `${y - half}px`;
      lens.style.backgroundSize = `${dispW * zoom}px ${dispH * zoom}px`;
      lens.style.backgroundPosition =
        `${-((x - offX) * zoom - half)}px ${-((y - offY) * zoom - half)}px`;
    },
    [src, size, zoom, fit]
  );

  const schedule = useCallback(
    (clientX, clientY) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => position(clientX, clientY));
    },
    [position]
  );

  const show = useCallback(() => {
    const lens = lensRef.current;
    if (!lens || !enabled || !src) return;

    // Deferred to first interaction: setting it at mount forces a second full
    // decode of an image already on screen.
    if (!primedRef.current) {
      lens.style.backgroundImage = `url(${src})`;
      primedRef.current = true;
    }
    lens.style.opacity = '1';
  }, [enabled, src]);

  const hide = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (lensRef.current) lensRef.current.style.opacity = '0';
  }, []);

  // Re-point the lens when the selection changes, but only if it was already
  // primed — otherwise this would defeat the deferred load above.
  useEffect(() => {
    if (primedRef.current && lensRef.current && src) {
      lensRef.current.style.backgroundImage = `url(${src})`;
    }
  }, [src]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /** Spread onto the frame element. */
  const frameProps = enabled
    ? {
        ref: frameRef,
        onMouseEnter: show,
        onMouseLeave: hide,
        onMouseMove: (e) => schedule(e.clientX, e.clientY),
      }
    : { ref: frameRef };

  return { frameProps, lensRef, onImageLoad };
};
