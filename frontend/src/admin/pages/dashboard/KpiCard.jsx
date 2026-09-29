import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiAlertTriangle } from 'react-icons/fi';
import { Delta, Sparkline } from './parts.jsx';

/**
 * One headline figure: a label, the number, what it means, and — optionally
 * — how it moved and its recent trend.
 *
 * The whole card opens the section its number comes from, when the viewer can
 * open that section; otherwise it is a plain card with no false promise of a
 * link. `hero` is the one figure the dashboard leads with, on the brand colour.
 * `alert` marks a number that needs acting on, with an icon and words.
 * `children` is extra detail under the number (the hero's breakdown).
 *
 * The hero sits on --gradient-button, not a run to --brand-primary-deep:
 * --on-primary is only validated against the primary, and the full run drops
 * it under 4.5:1 on a third of the presets. For the same reason its text is
 * never faded — secondary lines differ by size and weight, not opacity.
 */
export default function KpiCard({
  to,
  label,
  value,
  sub,
  delta,
  trend,
  hero = false,
  alert = null,
  palette,
  className = '',
  children,
}) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span
          className={`font-body text-sm font-medium ${hero ? 'text-on-primary' : 'text-brand-ink/60'}`}
        >
          {label}
        </span>
        {to ? (
          <span
            aria-hidden
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform
                        group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                          hero
                            ? 'bg-on-primary/15 text-on-primary'
                            : 'text-brand-ink/60 ring-1 ring-brand-ink/12'
                        }`}
          >
            <FiArrowUpRight size={15} />
          </span>
        ) : null}
      </span>

      <span
        className={`font-body text-3xl font-bold tracking-tight normal-nums sm:text-[2rem] ${
          hero ? 'text-on-primary' : alert ? 'text-critical' : 'text-brand-ink'
        }`}
      >
        {value}
      </span>

      {trend?.length ? (
        <Sparkline
          values={trend}
          stroke={hero ? palette.onPrimary : palette.ink}
          strokeOpacity={hero ? 0.55 : 0.3}
          dot={hero ? palette.onPrimary : palette.primary}
          ring={hero ? palette.primary : palette.surfaceCard}
        />
      ) : null}

      {children}

      <span className="mt-auto flex flex-col gap-1">
        {alert ? (
          <span className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-critical">
            <FiAlertTriangle aria-hidden size={13} /> {alert}
          </span>
        ) : null}
        {delta ? <Delta {...delta} onDark={hero} /> : null}
        {sub ? (
          <span className={`font-body text-xs ${hero ? 'font-medium text-on-primary' : 'text-brand-ink/50'}`}>
            {sub}
          </span>
        ) : null}
      </span>
    </>
  );

  const shape = `group flex min-h-[10.5rem] flex-col gap-2 rounded-3xl p-5 transition
                 ${hero ? 'shadow-md' : 'bg-surface-card shadow-sm ring-1 ring-black/5'}
                 ${to ? 'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-pink' : ''}
                 ${className}`;

  const style = hero
    ? { background: 'var(--gradient-button)' }
    : undefined;

  return to ? (
    <Link to={to} className={shape} style={style}>
      {body}
    </Link>
  ) : (
    <div className={shape} style={style}>
      {body}
    </div>
  );
}
