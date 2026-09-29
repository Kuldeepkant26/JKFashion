import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import { ChartTooltip } from './parts.jsx';
import { metres, count, rupees, rupeesCompact, shortDate, monthName } from './format.js';

/*
 * The dashboard's charts. One series each, in the theme's brand colour —
 * colour is identity here, not magnitude, so every bar wears the same one.
 * Marks are thin with 4px rounded data ends; gridlines are solid hairlines in
 * the ink colour; axis text and labels are in text colours, never the series
 * colour. Motion is skipped for anyone who has asked for less of it.
 */

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const axisTick = (palette) => ({ fill: palette.ink, fillOpacity: 0.5, fontSize: 11 });

const indexOfMax = (values) =>
  values.reduce((best, v, i, all) => (v > all[best] ? i : best), 0);

/**
 * A value above one bar, in ink — the only bar-top label a chart carries.
 *
 * Which bar gets it travels in the data (`top`), not as an index: Recharts
 * draws no rectangle for a zero bar and numbers the ones it does draw, so an
 * index would land on the wrong bar as soon as a day or month is empty.
 */
const withTop = (rows, index, text) =>
  rows.map((row, i) => ({ ...row, top: i === index ? text : '' }));

const topLabel = (palette) =>
  function TopLabel({ x, y, width, value }) {
    if (!value) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 6}
        textAnchor="middle"
        fill={palette.ink}
        fontSize={11}
        fontWeight={600}
      >
        {value}
      </text>
    );
  };

/** Metres logged per day. The best day carries its figure. */
export function ProductionChart({ days, palette }) {
  const best = indexOfMax(days.map((d) => d.metres));
  const data = withTop(days, best, days[best]?.metres ? metres(days[best].metres) : '');

  return (
    <div className="h-64 w-full sm:h-72" aria-label="Metres produced per day">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 4, bottom: 0, left: -6 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke={palette.ink} strokeOpacity={0.08} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={axisTick(palette)}
            axisLine={false}
            tickLine={false}
            minTickGap={18}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={count}
            tick={axisTick(palette)}
            axisLine={false}
            tickLine={false}
            width={46}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: palette.ink, fillOpacity: 0.05 }}
            content={<ChartTooltip formatValue={metres} formatLabel={shortDate} />}
          />
          <Bar
            dataKey="metres"
            fill={palette.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={!reducedMotion()}
          >
            <LabelList dataKey="top" content={topLabel(palette)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Money spent per month. The current month carries its figure. */
export function ExpensesChart({ months, palette }) {
  const latest = months.length - 1;
  const data = withTop(months, latest, months[latest]?.paise ? rupeesCompact(months[latest].paise) : '');

  return (
    <div className="h-56 w-full" aria-label="Expenses per month">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 4, bottom: 0, left: -2 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={palette.ink} strokeOpacity={0.08} />
          <XAxis
            dataKey="month"
            tickFormatter={(m) => monthName(m)}
            tick={axisTick(palette)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={rupeesCompact}
            tick={axisTick(palette)}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: palette.ink, fillOpacity: 0.05 }}
            content={<ChartTooltip formatValue={rupees} formatLabel={(m) => monthName(m, 'long')} />}
          />
          <Bar
            dataKey="paise"
            fill={palette.primary}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={!reducedMotion()}
          >
            <LabelList dataKey="top" content={topLabel(palette)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Enquiries per week, as a line over a light wash, with a crosshair on hover. */
export function EnquiriesChart({ weeks, palette }) {
  return (
    <div className="h-48 w-full" aria-label="Website enquiries per week">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={weeks} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke={palette.ink} strokeOpacity={0.08} />
          <XAxis
            dataKey="week"
            tickFormatter={shortDate}
            tick={axisTick(palette)}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={axisTick(palette)}
            axisLine={false}
            tickLine={false}
            width={40}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: palette.ink, strokeOpacity: 0.25 }}
            content={
              <ChartTooltip
                formatValue={(v) => `${count(v)} enquir${v === 1 ? 'y' : 'ies'}`}
                formatLabel={(w) => `Week of ${shortDate(w)}`}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={palette.primary}
            strokeWidth={2}
            fill={palette.primary}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 5, fill: palette.primary, stroke: palette.surfaceCard, strokeWidth: 2 }}
            isAnimationActive={!reducedMotion()}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * How much of what is on order has been made: a meter. The track is a light
 * step of the fill's own colour, so the whole arc reads as one measure.
 */
export function CompletionGauge({ pct, produced, ordered, palette }) {
  const radius = 80;
  const length = Math.PI * radius;
  const filled = (Math.min(100, Math.max(0, pct)) / 100) * length;
  const arc = `M 20 100 A ${radius} ${radius} 0 0 1 180 100`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[17rem]">
        <svg viewBox="0 0 200 110" className="w-full" aria-hidden>
          <path
            d={arc}
            fill="none"
            stroke={palette.primary}
            strokeOpacity={0.16}
            strokeWidth={18}
            strokeLinecap="round"
          />
          {filled > 0.5 ? (
            <path
              d={arc}
              fill="none"
              stroke={palette.primary}
              strokeWidth={18}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${length}`}
              style={{ transition: reducedMotion() ? 'none' : 'stroke-dasharray 800ms ease-out' }}
            />
          ) : null}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="font-body text-4xl font-bold tracking-tight text-brand-ink normal-nums">
            {pct.toFixed(0)}%
          </span>
          <span className="font-body text-xs text-brand-ink/50">of open orders made</span>
        </div>
      </div>

      <dl className="grid w-full grid-cols-2 gap-3">
        <div className="rounded-2xl bg-admin-cream/70 px-3 py-2.5">
          <dt className="flex items-center gap-1.5 font-body text-[11px] text-brand-ink/55">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: palette.primary }} />
            Produced
          </dt>
          <dd className="font-body text-base font-bold text-brand-ink">{metres(produced)}</dd>
        </div>
        <div className="rounded-2xl bg-admin-cream/70 px-3 py-2.5">
          <dt className="flex items-center gap-1.5 font-body text-[11px] text-brand-ink/55">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: palette.primary, opacity: 0.25 }}
            />
            Still to make
          </dt>
          <dd className="font-body text-base font-bold text-brand-ink">
            {metres(Math.max(0, ordered - produced))}
          </dd>
        </div>
      </dl>
    </div>
  );
}
