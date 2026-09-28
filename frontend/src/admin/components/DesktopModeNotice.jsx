import { useEffect, useState } from 'react';
import { FiSmartphone, FiX } from 'react-icons/fi';

const DISMISSED_KEY = 'jk.desktopModeNotice.dismissed';

/**
 * How much a phone is shrinking the page, when it is showing the desktop
 * version — or 0 when it is not.
 *
 * A browser's "Desktop site" setting lays the page out 980px wide and shrinks
 * it onto the screen, ignoring the page's own mobile layout, so the panel shows
 * as a miniature of the desktop view: too small to read or tap. The tell is a
 * touch screen whose own width is phone-sized showing a page far wider than
 * it. A desktop or tablet never matches, and nor does a phone in its normal
 * mode, where the page is as wide as the screen.
 */
const shrinkFactor = () => {
  if (typeof window === 'undefined' || !navigator.maxTouchPoints) return 0;

  const { width, height } = window.screen;
  const phone = Math.min(width, height) < 600;
  const factor = window.innerWidth / width;

  return phone && factor > 1.5 ? factor : 0;
};

const wasDismissed = () => {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Says how to turn "Desktop site" off, when a phone has it on.
 *
 * The setting belongs to the browser, and no page can override it, so the most
 * the panel can do is notice and explain. The notice is scaled back up by the
 * same factor the browser shrinks the page, so it reads at normal size on the
 * phone while everything around it is tiny. Dismissed for the rest of the
 * visit only, so it comes back if the setting is still on another day.
 */
export default function DesktopModeNotice() {
  const [factor, setFactor] = useState(shrinkFactor);
  const [dismissed, setDismissed] = useState(wasDismissed);

  /* A rotation or a change of setting changes the answer. */
  useEffect(() => {
    const update = () => setFactor(shrinkFactor());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (!factor || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Private mode — it simply shows again next time.
    }
  };

  return (
    <div
      role="status"
      style={{ zoom: factor }}
      className="mb-5 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200"
    >
      <FiSmartphone aria-hidden className="mt-0.5 shrink-0 text-amber-700" size={18} />
      <div className="min-w-0 flex-1 font-body text-sm text-amber-900">
        <p className="font-semibold">
          Your browser is showing the desktop version, so everything looks small.
        </p>
        <p className="mt-1">
          Turn off <b>Desktop site</b>: in Chrome tap <b>⋮</b> and untick Desktop site; in Safari
          tap <b>aA</b> and choose Request Mobile Website.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-amber-800
                   transition-colors hover:bg-amber-100"
      >
        <FiX />
      </button>
    </div>
  );
}
