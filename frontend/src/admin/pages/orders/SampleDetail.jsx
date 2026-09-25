import { useState } from 'react';
import { FiX, FiEdit2, FiTrash2, FiImage, FiArrowRight } from 'react-icons/fi';
import { TbCalculator } from 'react-icons/tb';
import * as inventoryApi from '../../../api/inventory.api.js';
import StitchCalculator from './StitchCalculator.jsx';
import {
  SAMPLE_STATUSES,
  SAMPLE_STATUS_LABELS,
  SAMPLE_STATUS_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatMetres,
} from './constants.js';

const Detail = ({ label, value }) => (
  <div>
    <dt className="font-body text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45">
      {label}
    </dt>
    <dd className="mt-0.5 font-body text-sm text-brand-ink">{value || '—'}</dd>
  </div>
);

/**
 * One sample: its status with the buyer, its design, and the orders raised
 * from it — the Sampling → Order → Production chain for this design.
 */
export default function SampleDetail({
  sample,
  loading,
  isOwner,
  busy,
  onClose,
  onEdit,
  onDelete,
  onChanged,
  onRaiseOrder,
  onOpenOrder,
  setError,
}) {
  const [calculating, setCalculating] = useState(false);

  const setStatus = async (status) => {
    setError('');
    try {
      onChanged(await inventoryApi.setSampleStatus(sample._id, status));
    } catch (err) {
      setError(err?.message ?? 'Could not change the status.');
    }
  };

  const orders = sample.orders ?? [];
  const totals = sample.orderTotals;
  const approved = sample.status === 'APPROVED';

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
      <StitchCalculator
        open={calculating}
        onClose={() => setCalculating(false)}
        title={`Calculator — design ${sample.designNumber}`}
        initial={{ repeat: sample.repeat, stitches: sample.stitches }}
      />

      <div className="flex items-start gap-3">
        {sample.designImage?.url ? (
          <img
            src={sample.designImage.url}
            alt={`Design ${sample.designNumber}`}
            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-brand-ink/8"
          />
        ) : (
          <span
            aria-hidden
            className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-ink/5 text-brand-ink/30"
          >
            <FiImage />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-brand-ink">
            Sample · Design {sample.designNumber}
          </h2>
          <p className="font-body text-xs text-brand-ink/50">
            {sample.companyName} · {sample.sampleNumber}
            {loading ? <span className="ml-2 text-brand-ink/40">refreshing…</span> : null}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand-ink/50
                     transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
        >
          <FiX />
        </button>
      </div>

      {sample.isOverdue ? (
        <p className="font-body text-xs font-semibold text-rose-600">
          Overdue — it was due to the buyer on {formatDate(sample.deadline)}.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
          Status
        </span>
        {SAMPLE_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            disabled={busy || s === sample.status}
            aria-pressed={s === sample.status}
            className={`rounded-full px-3 py-1.5 font-body text-xs font-semibold transition-colors
                        disabled:cursor-default ${
                          s === sample.status
                            ? SAMPLE_STATUS_STYLES[s]
                            : 'text-brand-ink/50 ring-1 ring-brand-ink/12 hover:bg-brand-ink/5'
                        }`}
          >
            {SAMPLE_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <dl className="grid gap-4 border-t border-brand-ink/8 pt-4 sm:grid-cols-3 lg:grid-cols-4">
        <Detail label="Fabric" value={sample.fabricType} />
        <Detail label="Width" value={sample.fabricWidth} />
        <Detail label="Yarn" value={sample.yarnType} />
        <Detail label="Colour" value={sample.yarnColor} />
        <Detail label="Repeat" value={sample.repeat ? `${sample.repeat}"` : ''} />
        <Detail
          label="Stitches / repeat"
          value={sample.stitches ? Number(sample.stitches).toLocaleString('en-IN') : ''}
        />
        <Detail label="Sample qty" value={sample.quantity ? `${formatMetres(sample.quantity)}m` : ''} />
        <Detail label="Due to buyer" value={formatDate(sample.deadline)} />
        <Detail label="Raised" value={formatDate(sample.createdAt)} />
        <Detail label="Sent" value={sample.sentAt ? formatDate(sample.sentAt) : ''} />
        <Detail label="Answered" value={sample.decidedAt ? formatDate(sample.decidedAt) : ''} />
      </dl>

      {sample.remarks ? (
        <div className="rounded-xl bg-admin-cream p-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45">
            Remarks
          </p>
          <p className="mt-1 whitespace-pre-line font-body text-sm text-brand-ink/80">
            {sample.remarks}
          </p>
        </div>
      ) : null}

      {/* Orders raised from this sample */}
      <div className="flex flex-col gap-3 border-t border-brand-ink/8 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            Production from this sample
          </h3>
          {approved ? (
            <button
              type="button"
              onClick={() => onRaiseOrder(sample)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-pink px-3 py-2
                         font-body text-xs font-semibold text-on-primary transition-colors
                         hover:bg-brand-pink-dark"
            >
              Raise production order <FiArrowRight aria-hidden />
            </button>
          ) : null}
        </div>

        {totals && orders.length ? (
          <dl className="grid grid-cols-3 gap-2">
            {[
              ['Ordered', totals.ordered],
              ['Produced', totals.produced],
              ['Remaining', totals.remaining],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-admin-cream px-3 py-2">
                <dt className="font-body text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45">
                  {label}
                </dt>
                <dd className="font-display text-base font-bold text-brand-ink">
                  {formatMetres(value)}m
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {orders.length ? (
          <ul className="flex flex-col">
            {orders.map((o) => (
              <li key={o._id} className="border-b border-brand-ink/8 last:border-0">
                <button
                  type="button"
                  onClick={() => onOpenOrder?.(o)}
                  disabled={!onOpenOrder}
                  className="flex w-full items-center justify-between gap-3 py-2 text-left
                             disabled:cursor-default"
                >
                  <span className="min-w-0">
                    <span className="block font-body text-sm font-semibold text-brand-ink">
                      {o.orderNumber}
                    </span>
                    <span className="block font-body text-[11px] text-brand-ink/45">
                      {formatMetres(o.completedMetres)}m of {formatMetres(o.orderedMetres)}m ·{' '}
                      {formatMetres(Math.max(0, o.orderedMetres - o.completedMetres))}m left
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[o.status]}`}
                  >
                    {STATUS_LABELS[o.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-sm text-brand-ink/45">
            {approved
              ? 'Approved — raise a production order to start the run.'
              : 'Once the buyer approves this sample, a production order can be raised from it.'}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-brand-ink/8 pt-4">
        <button
          type="button"
          onClick={() => onEdit(sample)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm
                     font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                     transition-colors hover:bg-brand-ink/5 disabled:opacity-60"
        >
          <FiEdit2 aria-hidden /> Edit sample
        </button>

        <button
          type="button"
          onClick={() => setCalculating(true)}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm
                     font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                     transition-colors hover:bg-brand-ink/5"
        >
          <TbCalculator aria-hidden /> Calculator
        </button>

        {isOwner ? (
          <button
            type="button"
            onClick={() => onDelete(sample)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm
                       font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors
                       hover:bg-rose-50 disabled:opacity-60"
          >
            <FiTrash2 aria-hidden /> Delete sample
          </button>
        ) : null}
      </div>
    </div>
  );
}
