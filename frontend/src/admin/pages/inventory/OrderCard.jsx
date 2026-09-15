import { FiImage } from 'react-icons/fi';
import { STATUS_LABELS, STATUS_STYLES, formatDate, formatMetres } from './constants.js';

/**
 * One order, as a card.
 *
 * The progress bar carries the number as well as the fill: a bar alone is hard
 * to read precisely, and "how many metres are left" is the question the floor
 * actually asks.
 */
export default function OrderCard({ order, onOpen }) {
  const ordered = Number(order.orderedMetres ?? 0);
  const done = Number(order.completedMetres ?? 0);
  const remaining = Math.max(0, ordered - done);
  const pct = ordered > 0 ? Math.min(100, (done / ordered) * 100) : 0;

  // Overdue outranks the stored status on the badge: it is the thing that
  // needs attention, and the status is still readable in the detail panel.
  const badge = order.isOverdue ? 'OVERDUE' : order.status;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(order)}
        className="flex w-full flex-col gap-3 rounded-2xl bg-surface-card p-4 text-left
                   shadow-sm ring-1 ring-black/5 transition hover:ring-brand-pink/40
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-brand-pink"
      >
        <div className="flex items-start gap-3">
          {order.designImage?.url ? (
            <img
              src={order.designImage.url}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-brand-ink/8"
            />
          ) : (
            <span
              aria-hidden
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-ink/5
                         text-brand-ink/30"
            >
              <FiImage />
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-sm font-semibold text-brand-ink">
              {order.companyName}
            </span>
            <span className="mt-0.5 block truncate font-body text-xs text-brand-ink/50">
              Design {order.designNumber} · Order {order.orderNumber}
            </span>
          </span>

          <span
            className={`shrink-0 rounded-full px-2 py-0.5 font-body text-[10px] font-semibold
                        uppercase tracking-wider ${STATUS_STYLES[badge]}`}
          >
            {STATUS_LABELS[badge]}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between font-body text-xs text-brand-ink/50">
            <span>Progress</span>
            <span className="font-semibold text-brand-ink">{pct.toFixed(0)}%</span>
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-ink/8"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${order.orderNumber} progress`}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                order.status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : order.isOverdue
                    ? 'bg-rose-500'
                    : 'bg-brand-pink'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <dl className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-body text-xs">
          <div className="flex gap-3">
            <span>
              <dt className="sr-only">Ordered</dt>
              <dd className="font-semibold text-brand-ink">{formatMetres(ordered)}m</dd>
              <span className="text-brand-ink/40">ordered</span>
            </span>
            <span>
              <dt className="sr-only">Done</dt>
              <dd className="font-semibold text-brand-ink">{formatMetres(done)}m</dd>
              <span className="text-brand-ink/40">done</span>
            </span>
            <span>
              <dt className="sr-only">Left</dt>
              <dd className="font-semibold text-brand-ink">{formatMetres(remaining)}m</dd>
              <span className="text-brand-ink/40">left</span>
            </span>
          </div>

          <span className={order.isOverdue ? 'font-semibold text-rose-600' : 'text-brand-ink/40'}>
            Due {formatDate(order.deadline)}
          </span>
        </dl>
      </button>
    </li>
  );
}
