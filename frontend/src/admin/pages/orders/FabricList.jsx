import { FABRIC_FIELDS } from './constants.js';

/**
 * A sample's or order's fabric rows, read-only — in the popup's own detail
 * style. With several rows, the labels show once on wider screens and the
 * rows line up beneath them, as in the form.
 */
export default function FabricList({ rows = [] }) {
  return (
    <div className="flex flex-col gap-3 border-t border-brand-ink/8 pt-4">
      <h3 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
        Fabric &amp; yarn
      </h3>
      {rows.length ? (
        rows.map((row, i) => (
          <dl
            key={i}
            className={`grid grid-cols-2 gap-4 sm:grid-cols-5 ${
              i ? 'border-t border-brand-ink/8 pt-3 sm:border-0 sm:pt-0' : ''
            }`}
          >
            {FABRIC_FIELDS.map((f) => (
              <div key={f.name} className="min-w-0">
                <dt
                  className={`font-body text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45 ${
                    i ? 'sm:sr-only' : ''
                  }`}
                >
                  {f.short}
                </dt>
                <dd className="mt-0.5 break-words font-body text-sm text-brand-ink">
                  {row[f.name] || '—'}
                </dd>
              </div>
            ))}
          </dl>
        ))
      ) : (
        <p className="font-body text-sm text-brand-ink/45">No fabric added yet.</p>
      )}
    </div>
  );
}
