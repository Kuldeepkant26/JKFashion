import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

/*
 * The dashboard's building blocks. Chart chrome follows one set of rules
 * throughout: hairline solid gridlines in the ink colour, thin marks with
 * rounded data ends, values in text colours (never the series colour), a
 * tooltip that leads with the value, and a table of the same numbers under
 * every chart so nothing is readable by hover or colour alone.
 */

/** A dashboard card. `action` sits top right — usually a "View all" link. */
export function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section
      className={`flex min-w-0 flex-col gap-4 rounded-3xl bg-surface-card p-5 shadow-sm ring-1
                  ring-black/5 sm:p-6 ${className}`}
    >
      {title ? (
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-body text-base font-semibold text-brand-ink">{title}</h3>
            {subtitle ? (
              <p className="mt-0.5 font-body text-xs text-brand-ink/50">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** "View all →" — only when the viewer can open the section it points at. */
export function CardLink({ to, children = 'View all' }) {
  if (!to) return null;
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-body text-xs
                 font-semibold text-brand-ink/60 ring-1 ring-brand-ink/10 transition-colors
                 hover:bg-brand-ink/5 hover:text-brand-ink"
    >
      {children} <FiArrowUpRight aria-hidden size={13} />
    </Link>
  );
}

/** A section's heading, with anything that scopes it (a range control) beside it. */
export function SectionHeading({ title, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-xl font-bold tracking-tight text-brand-ink">{title}</h2>
      {children}
    </div>
  );
}

/**
 * The tooltip every chart uses: the value strong, what it is secondary — the
 * reader already knows the series and wants the number.
 */
export function ChartTooltip({ active, payload, label, formatValue, formatLabel }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;

  return (
    <div className="rounded-xl bg-surface-card px-3 py-2 shadow-lg ring-1 ring-black/10">
      <p className="font-body text-sm font-bold text-brand-ink">{formatValue(value)}</p>
      <p className="font-body text-[11px] text-brand-ink/55">{formatLabel(label)}</p>
    </div>
  );
}

/**
 * The same numbers as the chart above, as a table — for anyone who cannot or
 * would rather not read them off bars. Closed by default.
 */
export function NumbersTable({ caption, columns, rows }) {
  return (
    <details className="group rounded-xl bg-admin-cream/60 px-3 py-2">
      <summary className="cursor-pointer select-none font-body text-xs font-semibold text-brand-ink/55 hover:text-brand-ink">
        Show numbers
      </summary>
      <div className="mt-2 max-h-56 overflow-auto">
        <table className="w-full font-body text-xs tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="text-left text-brand-ink/50">
              {columns.map((c, i) => (
                <th key={c} className={`py-1 font-semibold ${i ? 'text-right' : ''}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-brand-ink/8 text-brand-ink/80">
                {r.map((cell, i) => (
                  <td key={i} className={`py-1 ${i ? 'text-right' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/**
 * Horizontal bars as a list: label and value in text, a thin bar under each
 * for the comparison. One hue for every bar — the bars compare amounts; the
 * labels say what they are. A row with `to` opens where its number comes from.
 */
export function BarList({ rows, color, formatValue = String, emptyText }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  if (!rows.length || rows.every((r) => !r.value)) {
    return <p className="font-body text-sm text-brand-ink/45">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row) => {
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate font-body text-sm text-brand-ink/80">
                {row.label}
                {row.note ? (
                  <span className="ml-1.5 text-xs text-brand-ink/45">{row.note}</span>
                ) : null}
              </span>
              <span className="shrink-0 font-body text-sm font-semibold text-brand-ink">
                {formatValue(row.value)}
              </span>
            </span>
            <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-brand-ink/6">
              <span
                className="block h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${row.value ? Math.max(2, (row.value / max) * 100) : 0}%`,
                  background: row.muted ? 'currentColor' : color,
                  opacity: row.muted ? 0.25 : 1,
                }}
              />
            </span>
          </>
        );

        return (
          <li key={row.key}>
            {row.to ? (
              <Link
                to={row.to}
                className="block rounded-xl px-2 py-2 text-brand-ink transition-colors hover:bg-brand-ink/4"
              >
                {body}
              </Link>
            ) : (
              <div className="px-2 py-2 text-brand-ink">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Change against a named period. Coloured by whether the change is good —
 * `upIsGood` false for costs — and always with an arrow and words, never
 * colour alone.
 */
export function Delta({ value, versus, upIsGood = true, onDark = false }) {
  if (value === null || value === undefined) {
    return versus ? (
      <span className={`font-body text-xs ${onDark ? 'text-on-primary' : 'text-brand-ink/45'}`}>
        {versus}
      </span>
    ) : null;
  }

  const up = value > 0;
  const good = value === 0 ? null : up === upIsGood;
  const Icon = up ? FiArrowUpRight : FiArrowDownRight;
  const tone = onDark
    ? 'text-on-primary'
    : good === null
      ? 'text-brand-ink/55'
      : good
        ? 'text-good'
        : 'text-critical';

  return (
    <span className={`inline-flex items-center gap-1 font-body text-xs ${tone}`}>
      {value !== 0 ? <Icon aria-hidden size={13} /> : null}
      <b className="font-semibold">
        {value > 0 ? '+' : ''}
        {value}%
      </b>
      <span className={onDark ? 'text-on-primary' : 'text-brand-ink/45'}>{versus}</span>
    </span>
  );
}

/**
 * A small trend line: the history in a quiet stroke, the latest point marked
 * — with a ring in the surface colour so the dot stays legible on the line.
 * Decorative beside a tile's own number, so hidden from assistive technology.
 */
export function Sparkline({ values, stroke, dot, ring, strokeOpacity = 0.4 }) {
  const data = values.map((v, i) => ({ i, v }));
  const last = data.length - 1;

  return (
    <div aria-hidden className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <YAxis hide domain={[0, 'dataMax']} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeOpacity={strokeOpacity}
            strokeWidth={2}
            isAnimationActive={false}
            dot={(props) =>
              props.index === last ? (
                <circle
                  key="last"
                  cx={props.cx}
                  cy={props.cy}
                  r={4}
                  fill={dot}
                  stroke={ring}
                  strokeWidth={2}
                />
              ) : (
                <g key={props.index} />
              )
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** The period switch: a segmented control, the chosen one raised. */
export function RangeControl({ value, options, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-2xl bg-brand-ink/4 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-xl px-3.5 py-2 font-body text-xs font-semibold transition-colors ${
            value === o.value
              ? 'bg-surface-card text-brand-ink shadow-sm'
              : 'text-brand-ink/55 hover:text-brand-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
