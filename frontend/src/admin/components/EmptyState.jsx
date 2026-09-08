/**
 * Shown wherever a panel has no data yet.
 *
 * Every dashboard panel starts empty by design — the endpoints return empty
 * arrays rather than invented numbers — so this is a first-class state, not an
 * edge case.
 */
export default function EmptyState({ title, hint, icon: Icon, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl
                  border border-dashed border-brand-ink/10 px-6 py-10 text-center ${className}`}
    >
      {/* A component, not a string: real icons inherit currentColor and scale
          with the type, which an emoji glyph cannot do. */}
      {Icon ? <Icon size={26} className="text-brand-ink/25" aria-hidden="true" /> : null}
      <p className="font-body text-sm font-medium text-brand-ink/70">{title}</p>
      {hint ? <p className="font-body text-xs text-brand-ink/45">{hint}</p> : null}
    </div>
  );
}
