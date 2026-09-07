import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import EmptyState from './EmptyState.jsx';
import { useResolvedPalette } from '../../theme/useResolvedPalette.js';

const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const formatAxisDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit' });

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-surface-card px-3 py-2 shadow-lg ring-1 ring-black/5">
      <p className="font-display text-sm font-bold text-brand-ink">
        {payload[0].value.toLocaleString()}
      </p>
      <p className="font-body text-xs text-brand-ink/50">
        {new Date(label).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
      </p>
    </div>
  );
};

export default function ActivityChart({ points = [], range = '7d', onRangeChange }) {
  const hasData = points.length > 0;

  // Recharts writes these into SVG presentation attributes, which do not take
  // var() reliably — so the palette is resolved to hex and re-read on change.
  const palette = useResolvedPalette();

  return (
    <section className="rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-ink">Activity</h2>
          <p className="mt-0.5 font-body text-xs text-brand-ink/45">
            Site traffic over the selected period
          </p>
        </div>

        {/* A native select: keyboard support, mobile pickers and screen-reader
            behaviour all come for free, and none of it needs re-implementing. */}
        <label className="relative">
          <span className="sr-only">Date range</span>
          <select
            value={range}
            onChange={(e) => onRangeChange?.(e.target.value)}
            className="appearance-none rounded-full border border-brand-ink/12 bg-surface-card
                       py-2 pl-4 pr-9 font-body text-sm text-brand-ink outline-none
                       transition-colors hover:border-brand-ink/25
                       focus-visible:border-brand-pink focus-visible:ring-2
                       focus-visible:ring-brand-pink/25"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2
                       text-brand-ink/40"
            aria-hidden="true"
          >
            <path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
      </div>

      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="jkActivityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.primary} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={palette.primary} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke={palette.ink} strokeOpacity={0.06} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tickLine={false}
                axisLine={false}
                tick={{ fill: palette.ink, fillOpacity: 0.4, fontSize: 12 }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: palette.ink, fillOpacity: 0.4, fontSize: 12 }}
                width={56}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: palette.primary, strokeOpacity: 0.25 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={palette.primary}
                strokeWidth={2.5}
                fill="url(#jkActivityFill)"
                dot={false}
                activeDot={{ r: 5, fill: palette.primary, stroke: palette.surfaceCard, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          className="h-64"
          icon="📈"
          title="No activity recorded yet"
          hint="Traffic will appear here once analytics are connected."
        />
      )}
    </section>
  );
}
