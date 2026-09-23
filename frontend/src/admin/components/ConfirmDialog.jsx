import { useState } from 'react';
import Modal from './Modal.jsx';

/**
 * "Are you sure?" for the destructive actions.
 *
 * Replaces `window.confirm`, which cannot be styled, cannot say which record it
 * means in anything but plain text, and blocks the whole tab while it is up. It
 * also keeps the button disabled while the action runs, so a slow delete cannot
 * be fired twice.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  /** Destructive by default — that is what confirmation is usually for. */
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  const confirmClass =
    tone === 'danger'
      ? 'bg-rose-600 text-white hover:bg-rose-700'
      : 'bg-brand-pink text-on-primary hover:bg-brand-pink-dark';

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onCancel}
      title={title}
      size="sm"
      /* A misclick on the backdrop mid-delete should not look like a cancel. */
      closeOnBackdrop={!busy}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl px-4 py-2.5 font-body text-sm font-semibold text-brand-ink/70
                       ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                       disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className={`rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition-colors
                        focus-visible:outline-2 focus-visible:outline-offset-2
                        disabled:opacity-60 ${confirmClass}`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="font-body text-sm text-brand-ink/75">{message}</p>
    </Modal>
  );
}
