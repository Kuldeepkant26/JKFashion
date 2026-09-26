import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

/**
 * A dialog for the admin forms.
 *
 * The inventory forms used to render inline, pushing the list they belonged to
 * down the page; on a laptop the submit button could sit below the fold while
 * the records being edited scrolled away above it. A dialog keeps the form in
 * one place and the list where it was.
 *
 * Portalled to <body> so no ancestor's `overflow` or stacking context can clip
 * it. The admin chrome owns z-20/30/40 (mobile bar, backdrop, sidebar), so this
 * sits at z-50 — above the pinned sidebar, which is the point.
 */

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-3xl',
};

/** Everything focusable inside the panel, in tab order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The dialogs currently open, innermost last.
 *
 * Dialogs stack — a confirmation or the calculator opens over a record's
 * popup — and every open one listens on `document`. Only the top one may
 * answer Escape and Tab, or one keypress closes the whole stack. The page
 * behind is locked when the first opens and released when the last closes,
 * so two dialogs closing in the same render cannot restore each other's
 * styles out of order and leave the page stuck unscrollable.
 */
const openDialogs = [];
let savedBodyStyle = null;

const lockBody = () => {
  if (savedBodyStyle) return;
  const { overflow, paddingRight } = document.body.style;
  savedBodyStyle = { overflow, paddingRight };

  /*
   * Without this, scrolling inside the panel chains to the body once it hits
   * its end and the page drifts underneath — on iOS it never comes back to
   * where it was. The scrollbar's width is replaced so the page does not jump
   * sideways.
   */
  const gap = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  if (gap > 0) document.body.style.paddingRight = `${gap}px`;
};

const unlockBody = () => {
  if (openDialogs.length || !savedBodyStyle) return;
  document.body.style.overflow = savedBodyStyle.overflow;
  document.body.style.paddingRight = savedBodyStyle.paddingRight;
  savedBodyStyle = null;
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  /**
   * A failure to show inside the dialog. The page's own banner sits behind the
   * backdrop while a dialog is up, so an action that fails in here has to say
   * so in here — pinned above the actions, where the eye already is.
   */
  error,
  size = 'lg',
  /** Set false for a form with unsaved input, where a stray click is costly. */
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null);
  const titleId = useRef(`modal-${Math.random().toString(36).slice(2, 9)}`).current;

  /* Whatever had focus before we opened, so it can be handed back on close. */
  const restoreTo = useRef(null);

  /*
   * The latest `onClose`, read through a ref so `close` never changes. Callers
   * pass inline handlers, and an effect keyed on them re-ran on every parent
   * render — handing focus back and grabbing it again mid-typing, and moving
   * this dialog to the top of the stack over one opened above it.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const close = useCallback(() => onCloseRef.current?.(), []);

  useEffect(() => {
    if (!open) return undefined;

    restoreTo.current = document.activeElement;

    const self = {};
    openDialogs.push(self);
    lockBody();

    const onKeyDown = (e) => {
      // A dialog opened over this one owns the keyboard until it closes.
      if (openDialogs[openDialogs.length - 1] !== self) return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      }

      if (e.key !== 'Tab') return;

      // Focus trap: Tab past the last control wraps to the first, and back.
      const nodes = [...(panelRef.current?.querySelectorAll(FOCUSABLE) ?? [])].filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    /* Focus the first real control, so a keyboard user starts in the form
       rather than on the close button. */
    const timer = setTimeout(() => {
      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
      const target = [...(nodes ?? [])].find((el) => !el.dataset.modalDismiss);
      (target ?? panelRef.current)?.focus();
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown, true);
      openDialogs.splice(openDialogs.indexOf(self), 1);
      unlockBody();
      // Only take focus back if it is still inside the dialog being removed.
      if (restoreTo.current?.isConnected) restoreTo.current.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden
        onClick={closeOnBackdrop ? close : undefined}
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] ${
          closeOnBackdrop ? 'cursor-pointer' : ''
        }`}
      />

      {/* Full-height sheet on a phone, centred card above it. The body is the
          only part that scrolls, so the header and the actions stay reachable
          however long the form is. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden
                    rounded-t-2xl bg-surface-card shadow-2xl ring-1 ring-black/10
                    sm:max-h-[88vh] sm:rounded-2xl ${SIZES[size] ?? SIZES.lg}`}
      >
        <header className="flex items-start gap-3 border-b border-brand-ink/8 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-lg font-bold text-brand-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 font-body text-xs text-brand-ink/55">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            data-modal-dismiss="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand-ink/50
                       transition-colors hover:bg-brand-ink/5 hover:text-brand-ink
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-brand-pink"
          >
            <FiX />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {error ? (
          <p
            role="alert"
            className="border-t border-rose-100 bg-rose-50 px-5 py-2.5 font-body text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}

        {footer ? (
          <footer
            className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-ink/8
                       bg-surface-card px-5 py-4"
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
