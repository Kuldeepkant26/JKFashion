/** Compact number formatting — 27,600,000 reads better as 27.6m on a tile. */
const formatValue = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
};

/**
 * One number from the database, with a plain description of what it counts.
 *
 * This previously showed a "+0% vs last period" delta and a trend arrow. There
 * was no previous period being compared — the figure was hardcoded — so the
 * arrow implied a trend the panel had never measured. A factual hint is worth
 * more than a comparison that is not real.
 */
export default function StatTile({ label, value, hint, highlight = false }) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm ring-1 transition-colors
                  ${
                    highlight
                      ? 'bg-brand-pink/8 ring-brand-pink/25'
                      : 'bg-surface-card ring-black/5'
                  }`}
    >
      <span className="font-body text-sm text-brand-ink/55">{label}</span>

      <p
        className={`mt-3 font-display text-3xl font-bold tracking-tight
                    ${highlight ? 'text-brand-pink' : 'text-brand-ink'}`}
      >
        {formatValue(value)}
      </p>

      {hint ? <p className="mt-1 font-body text-xs text-brand-ink/45">{hint}</p> : null}
    </div>
  );
}
