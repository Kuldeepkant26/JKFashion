import { useEffect, useRef, useState } from 'react';
import { FiUploadCloud, FiTrash2, FiRotateCcw } from 'react-icons/fi';
import { MAX_IMAGE_BYTES, IMAGE_ACCEPT, labelClass } from './constants.js';

/**
 * The design image on a sample or order form: choose, replace or remove.
 *
 * Controlled. The form owns `file` (a newly chosen image) and `removed` (the
 * saved image is to be cleared on save), and decides what to call on submit.
 * Removing is staged rather than immediate so Cancel still means "nothing
 * changed".
 *
 * This is only ever the design. The buyer's logo is set on the company, and
 * nothing here reads from or writes to it.
 */
export default function DesignImageField({
  label = 'Design image',
  existingUrl,
  file,
  onFile,
  removed,
  onRemovedChange,
  setError,
  hint,
}) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);

  // Object URLs need revoking, or every preview leaks until a reload.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (chosen) => {
    if (!chosen) return;
    if (chosen.size > MAX_IMAGE_BYTES) {
      setError?.('That image is larger than 8MB. Please choose a smaller file.');
      return;
    }
    onRemovedChange?.(false);
    onFile(chosen);
  };

  const shown = preview ?? (removed ? null : existingUrl);

  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-admin-cream px-3 py-2
                     text-left ring-1 ring-brand-ink/12 transition-shadow hover:ring-brand-pink
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-brand-pink"
        >
          {shown ? (
            <img src={shown} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-ink/5 text-brand-ink/40">
              <FiUploadCloud />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate font-body text-xs text-brand-ink/60">
            {file
              ? file.name
              : removed
                ? 'Image will be removed on save — choose one to replace it'
                : existingUrl
                  ? 'Replace image'
                  : 'Choose an image (optional)'}
          </span>
        </button>

        {file ? (
          <button
            type="button"
            onClick={() => onFile(null)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-body text-xs
                       font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                       transition-colors hover:bg-brand-ink/5"
          >
            <FiTrash2 aria-hidden size={13} /> Clear
          </button>
        ) : existingUrl && onRemovedChange ? (
          <button
            type="button"
            onClick={() => onRemovedChange(!removed)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-body text-xs
                        font-semibold transition-colors ${
                          removed
                            ? 'text-brand-ink/70 ring-1 ring-brand-ink/12 hover:bg-brand-ink/5'
                            : 'text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50'
                        }`}
          >
            {removed ? (
              <>
                <FiRotateCcw aria-hidden size={13} /> Keep image
              </>
            ) : (
              <>
                <FiTrash2 aria-hidden size={13} /> Remove image
              </>
            )}
          </button>
        ) : null}
      </div>

      {hint ? <span className="font-body text-xs text-brand-ink/45">{hint}</span> : null}

      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          // Reset so re-picking the same file fires change again.
          e.target.value = '';
        }}
      />
    </div>
  );
}
