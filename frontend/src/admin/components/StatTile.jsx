/** Compact number formatting — 27,600,000 reads better as 27.6m on a tile. */
const formatValue = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
};

export default function StatTile({ label, value, deltaPct, direction }) {
  const isUp = direction === 'up';

  return (
    <div className="rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-body text-sm text-brand-ink/55">{label}</span>
        <span
          className={`grid h-6 w-6 place-items-center rounded-full ${
            isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
          // The arrow duplicates the sign already stated in the delta text, so
          // it is decorative rather than information a screen reader needs.
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5">
            <path
              d={isUp ? 'M10 15V5m0 0-4 4m4-4 4 4' : 'M10 5v10m0 0 4-4m-4 4-4-4'}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <div className="mt-3 h-px w-full bg-brand-ink/8" />

      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-ink">
        {formatValue(value)}
      </p>

      <p className={`mt-1 font-body text-xs ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isUp ? '+' : '−'}
        {Math.abs(deltaPct)}% <span className="text-brand-ink/40">vs last period</span>
      </p>
    </div>
  );
}
