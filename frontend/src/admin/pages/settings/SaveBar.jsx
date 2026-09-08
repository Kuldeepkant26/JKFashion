/**
 * The unsaved-changes bar, shared by every settings tab.
 *
 * Floats above the page rather than sitting in the flow, so it stays reachable
 * from anywhere in a long grid without scrolling to the end. role=region +
 * aria-live so a screen reader is told changes are pending when it appears.
 */
export default function SaveBar({ summary, saving, onDiscard, onSave }) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Unsaved changes"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-lg flex-wrap items-center
                 justify-between gap-3 rounded-2xl bg-surface-card/95 p-3 pl-4 shadow-2xl
                 ring-1 ring-black/10 backdrop-blur sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <p className="text-sm text-brand-ink/70">{summary}</p>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={saving}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-ink/70
                     ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-brand-pink disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-brand-pink px-5 py-2.5 text-sm font-semibold text-on-primary
                     transition-colors hover:bg-brand-pink-dark
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-brand-pink disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
