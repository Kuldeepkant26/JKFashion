import { useState } from 'react';
import { FiCopy, FiCheck, FiAlertTriangle, FiX } from 'react-icons/fi';

/**
 * Shows a newly set password once, with a copy button.
 *
 * This exists because stored passwords cannot be shown: they are bcrypt
 * hashes, which is one-way by design, so not even the server can read one
 * back. The answer to "what is their password" is therefore to set a new one
 * and hand it over — which is the moment this component covers.
 *
 * Dismissing it is deliberate and explicit. The value is gone from the server
 * the instant it is hashed, so a panel that scrolled away on its own could
 * lose the only copy.
 */
export default function PasswordReveal({ name, password, onDismiss }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some browsers without a user gesture or over
      // plain http. The password is on screen regardless, so this is a
      // convenience failing, not the feature failing.
    }
  };

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200"
    >
      <div className="flex items-start gap-2.5">
        <FiAlertTriangle
          size={18}
          className="mt-0.5 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm font-semibold text-amber-900">
            New password for {name}
          </p>
          <p className="mt-0.5 font-body text-xs leading-relaxed text-amber-800">
            Copy it now and give it to them. It is stored encrypted, so it cannot be
            shown again — if it is lost you will have to set another one.
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-amber-700
                     transition-colors hover:bg-amber-100"
        >
          <FiX size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* A real input so the value can be selected and read by a screen
            reader, but read-only — it is a display, not a field. */}
        <input
          readOnly
          value={password}
          onFocus={(e) => e.target.select()}
          aria-label={`Password for ${name}`}
          className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2.5 font-mono text-sm
                     tracking-wide text-brand-ink ring-1 ring-amber-200
                     focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-600 px-3.5
                     py-2.5 font-body text-xs font-semibold text-white transition-colors
                     hover:bg-amber-700"
        >
          {copied ? <FiCheck size={14} aria-hidden="true" /> : <FiCopy size={14} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
