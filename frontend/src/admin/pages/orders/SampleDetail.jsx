import { useState } from 'react';
import { FiEdit2, FiTrash2, FiImage, FiArrowRight } from 'react-icons/fi';
import { TbCalculator } from 'react-icons/tb';
import * as inventoryApi from '../../../api/inventory.api.js';
import Modal from '../../components/Modal.jsx';
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

const secondaryButton =
  'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm font-semibold ' +
  'text-brand-ink/70 ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5 ' +
  'disabled:opacity-60';

/**
 * One sample, in a popup: where it is with the buyer, its design, and — once
 * it has been converted — the production order it became.
 *
 * There is no "convert" button here on purpose. A sample becomes an order one
 * way: Production → New order, where it is picked from the list.
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
  onOpenOrder,
  error,
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

  const inProduction = sample.status === 'IN_PRODUCTION';
  const order = sample.order;
  const badge = sample.isOverdue ? 'OVERDUE' : sample.status;

  const ordered = Number(order?.orderedMetres ?? 0);
  const produced = Number(order?.completedMetres ?? 0);
  const pct = ordered > 0 ? Math.min(100, (produced / ordered) * 100) : 0;

  return (
    <>
      <Modal
        error={error}
        open
        onClose={onClose}
        title={`Sample ${sample.sampleNumber}`}
        description={`${sample.companyName} · Design ${sample.designNumber}${
          loading ? ' · refreshing…' : ''
        }`}
        footer={
          <>
            {/* Destructive and owner-only, like the API. A sample in production
                cannot be deleted while its order exists, so it is not offered. */}
            {isOwner && !inProduction ? (
              <button
                type="button"
                onClick={() => onDelete(sample)}
                disabled={busy}
                className="mr-auto inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-body
                           text-sm font-semibold text-rose-700 ring-1 ring-rose-200
                           transition-colors hover:bg-rose-50 disabled:opacity-60"
              >
                <FiTrash2 aria-hidden /> Delete
              </button>
            ) : null}

            <button type="button" onClick={() => setCalculating(true)} className={secondaryButton}>
              <TbCalculator aria-hidden /> Calculator
            </button>

            <button
              type="button"
              onClick={() => onEdit(sample)}
              disabled={busy}
              className={secondaryButton}
            >
              <FiEdit2 aria-hidden /> Edit sample
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            {sample.designImage?.url ? (
              <img
                src={sample.designImage.url}
                alt={`Design ${sample.designNumber}`}
                className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-brand-ink/8"
              />
            ) : (
              <span
                aria-hidden
                className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-brand-ink/5 text-brand-ink/30"
              >
                <FiImage size={22} />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-brand-ink">
                Design {sample.designNumber}
              </p>
              <p className="font-body text-xs text-brand-ink/50">{sample.companyName}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 font-body text-[10px]
                            font-semibold uppercase tracking-wider ${SAMPLE_STATUS_STYLES[badge]}`}
              >
                {SAMPLE_STATUS_LABELS[badge]}
              </span>
              {sample.isOverdue ? (
                <p className="mt-1 font-body text-xs font-semibold text-rose-600">
                  It was due to the buyer on {formatDate(sample.deadline)}.
                </p>
              ) : null}
            </div>
          </div>

          {/* While in sampling the status is set here; once converted it follows the order. */}
          {inProduction ? null : (
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
          )}

          {sample.status === 'APPROVED' ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 font-body text-xs text-emerald-800">
              Ready for production — pick it from <b>Production → New order</b> to convert it into
              an order.
            </p>
          ) : null}

          {/* The order this sample became. */}
          {inProduction && order ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-sky-50/60 p-4 ring-1 ring-sky-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-body text-sm text-brand-ink">
                  In production as order <b>{order.orderNumber}</b>
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider ${
                    STATUS_STYLES[order.status]
                  }`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between font-body text-xs text-brand-ink/60">
                  <span>
                    {formatMetres(ordered)}m ordered − {formatMetres(produced)}m produced ={' '}
                    <b className="text-brand-ink">{formatMetres(order.remainingMetres)}m remaining</b>
                  </span>
                  <span className="font-semibold text-brand-ink">{pct.toFixed(0)}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-ink/8">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {onOpenOrder ? (
                <button
                  type="button"
                  onClick={() => onOpenOrder(order)}
                  className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-brand-pink px-3 py-2
                             font-body text-xs font-semibold text-on-primary transition-colors
                             hover:bg-brand-pink-dark"
                >
                  Open order <FiArrowRight aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}

          <dl className="grid gap-4 border-t border-brand-ink/8 pt-4 grid-cols-2 sm:grid-cols-4">
            <Detail label="Fabric" value={sample.fabricType} />
            <Detail label="Width" value={sample.fabricWidth} />
            <Detail label="Yarn" value={sample.yarnType} />
            <Detail label="Colour" value={sample.yarnColor} />
            <Detail label="Repeat" value={sample.repeat ? `${sample.repeat}"` : ''} />
            <Detail
              label="Stitches / repeat"
              value={sample.stitches ? Number(sample.stitches).toLocaleString('en-IN') : ''}
            />
            <Detail
              label="Sample qty"
              value={sample.quantity ? `${formatMetres(sample.quantity)}m` : ''}
            />
            <Detail label="Due to buyer" value={formatDate(sample.deadline)} />
            <Detail label="Raised" value={formatDate(sample.createdAt)} />
            <Detail
              label={sample.status === 'REJECTED' ? 'Rejected' : 'Approved'}
              value={sample.decidedAt ? formatDate(sample.decidedAt) : ''}
            />
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
        </div>
      </Modal>

      <StitchCalculator
        open={calculating}
        onClose={() => setCalculating(false)}
        title={`Calculator — design ${sample.designNumber}`}
        initial={{ repeat: sample.repeat, stitches: sample.stitches }}
      />
    </>
  );
}
