import { formatMetres } from './constants.js';

/**
 * A tile of one figure.
 *
 * Not the dashboard's `StatTile`: that one always renders a "+N% vs last
 * period" line, and there is no previous period for "3 orders overdue" — a
 * fake 0% delta would be worse than no delta at all.
 */
const Tile = ({ label, value, unit, tone = 'neutral' }) => {
  const tones = {
    neutral: 'text-brand-ink',
    brand: 'text-brand-pink',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    good: 'text-emerald-600',
  };

  return (
    <div className="rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-black/5">
      <p className="font-body text-xs text-brand-ink/50">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tracking-tight ${tones[tone]}`}>
        {value}
        {unit ? <span className="ml-0.5 text-base font-semibold">{unit}</span> : null}
      </p>
    </div>
  );
};

/**
 * The completion ring.
 *
 * Hand-drawn SVG rather than a charting library: it is one arc, and recharts
 * would pull a full cartesian engine in to draw a circle. The dash offset is
 * the whole trick — a stroke that covers `pct` of the circumference.
 */
const Gauge = ({ pct }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(100, Math.max(0, pct)) / 100) * circumference;

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-black/5">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="7"
            className="stroke-brand-ink/10"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            className="stroke-brand-pink transition-[stroke-dasharray] duration-700"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-base font-bold text-brand-ink">
          {pct.toFixed(0)}%
        </span>
      </div>

      <div className="min-w-0">
        <p className="font-body text-xs uppercase tracking-wider text-brand-ink/50">
          Overall completion
        </p>
        <p className="mt-1 font-body text-sm text-brand-ink/70">
          Across every order on the floor.
        </p>
      </div>
    </div>
  );
};

export default function InventoryStats({ summary }) {
  if (!summary) return null;

  const { counts = {} } = summary;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <Gauge pct={summary.overallPct ?? 0} />
        </div>

        <Tile label="Active orders" value={counts.ACTIVE ?? 0} tone="brand" />
        <Tile
          label="Overdue"
          value={counts.OVERDUE ?? 0}
          tone={counts.OVERDUE > 0 ? 'danger' : 'neutral'}
        />
        <Tile
          label="Produced today"
          value={formatMetres(summary.todayProduced)}
          unit="m"
          tone="good"
        />
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface-card px-4 py-3 shadow-sm ring-1 ring-black/5">
          <dt className="font-body text-xs text-brand-ink/50">Ordered</dt>
          <dd className="font-display text-lg font-bold text-brand-ink">
            {formatMetres(summary.totalOrdered)}m
          </dd>
        </div>
        <div className="rounded-2xl bg-surface-card px-4 py-3 shadow-sm ring-1 ring-black/5">
          <dt className="font-body text-xs text-brand-ink/50">Produced</dt>
          <dd className="font-display text-lg font-bold text-brand-ink">
            {formatMetres(summary.totalProduced)}m
          </dd>
        </div>
        <div className="rounded-2xl bg-surface-card px-4 py-3 shadow-sm ring-1 ring-black/5">
          <dt className="font-body text-xs text-brand-ink/50">Remaining</dt>
          <dd className="font-display text-lg font-bold text-brand-ink">
            {formatMetres(summary.totalRemaining)}m
          </dd>
        </div>
      </dl>
    </div>
  );
}
