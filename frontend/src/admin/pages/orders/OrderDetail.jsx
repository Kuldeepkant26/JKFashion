import { useState } from 'react';
import { FiX, FiEdit2, FiTrash2, FiPlus, FiImage, FiLink } from 'react-icons/fi';
import { TbCalculator } from 'react-icons/tb';
import * as inventoryApi from '../../../api/inventory.api.js';
import Spinner from '../../components/Spinner.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import StitchCalculator from './StitchCalculator.jsx';
import {
  ORDER_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatMetres,
  inputClass,
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
 * Add a day's production. Inline rather than a modal — it is two fields.
 *
 * Shows what is left on the order and what this entry would leave, so the
 * person logging sees Ordered − Produced = Remaining as they type.
 */
function LogForm({ orderId, ordered, produced, onLogged, onCancel, setError }) {
  const [metres, setMetres] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await inventoryApi.logProduction(orderId, {
        metres: Number(metres),
        date,
        note,
      });
      onLogged(updated);
    } catch (err) {
      setError(err?.message ?? 'Could not log that.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl bg-admin-cream p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            Metres *
          </span>
          <input
            type="number"
            step="0.1"
            required
            autoFocus
            value={metres}
            onChange={(e) => setMetres(e.target.value)}
            className={inputClass}
            placeholder="40"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            Note
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </label>
      </div>

      <p className="font-body text-xs text-brand-ink/70">
        {formatMetres(ordered)}m ordered − {formatMetres(produced)}m produced ={' '}
        <b>{formatMetres(Math.max(0, ordered - produced))}m remaining</b>
        {Number(metres) ? (
          <>
            {' '}
            · after this entry:{' '}
            <b>{formatMetres(Math.max(0, ordered - produced - Number(metres)))}m</b>
          </>
        ) : null}
      </p>

      <p className="font-body text-xs text-brand-ink/50">
        To correct a mistake, log a negative number with a note — the original entry and its
        correction both stay in the history.
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-pink px-4 py-2 font-body text-sm font-semibold
                     text-on-primary transition-colors hover:bg-brand-pink-dark
                     disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Add entry'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 font-body text-sm font-semibold text-brand-ink/70
                     ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function OrderDetail({
  order,
  loading,
  isOwner,
  busy,
  onClose,
  onEdit,
  onDelete,
  onChanged,
  onOpenSample,
  setError,
}) {
  const [logging, setLogging] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [confirmingEntry, setConfirmingEntry] = useState(null);

  /*
   * Only a genuinely absent order falls back to the spinner. `loading` here
   * means the full record — the one carrying the production log — is still on
   * its way, while the card's own copy is already being shown; swapping that
   * for a spinner would blank a panel that has something to display.
   */
  if (!order) {
    return (
      <div className="grid min-h-[30vh] place-items-center rounded-2xl bg-surface-card shadow-sm ring-1 ring-black/5">
        <Spinner label="Loading order" />
      </div>
    );
  }

  const ordered = Number(order.orderedMetres ?? 0);
  const done = Number(order.completedMetres ?? 0);
  const remaining = Math.max(0, ordered - done);
  const pct = ordered > 0 ? Math.min(100, (done / ordered) * 100) : 0;
  const log = order.log ?? [];

  const setStatus = async (status) => {
    setError('');
    try {
      onChanged(await inventoryApi.setOrderStatus(order._id, status));
    } catch (err) {
      setError(err?.message ?? 'Could not change the status.');
    }
  };

  const removeEntry = async () => {
    setError('');
    try {
      onChanged(await inventoryApi.deleteLogEntry(order._id, confirmingEntry._id));
      setConfirmingEntry(null);
    } catch (err) {
      setError(err?.message ?? 'Could not remove that entry.');
      setConfirmingEntry(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
      <StitchCalculator
        open={calculating}
        onClose={() => setCalculating(false)}
        title={`Calculator — order ${order.orderNumber}`}
        initial={{ quantity: remaining || ordered, repeat: order.repeat, stitches: order.stitches }}
      />

      <ConfirmDialog
        open={Boolean(confirmingEntry)}
        title="Remove this log entry?"
        message={
          confirmingEntry
            ? `${formatMetres(confirmingEntry.metres)}m logged on ${formatDate(
                confirmingEntry.date
              )} will be removed and the order's total adjusted. To correct a figure instead, log a negative entry with a note — that keeps the history.`
            : ''
        }
        confirmLabel="Remove entry"
        onConfirm={removeEntry}
        onCancel={() => setConfirmingEntry(null)}
      />

      <div className="flex items-start gap-3">
        {order.designImage?.url ? (
          <img
            src={order.designImage.url}
            alt={`Design ${order.designNumber}`}
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
          <h2 className="font-display text-lg font-bold text-brand-ink">{order.companyName}</h2>
          <p className="font-body text-xs text-brand-ink/50">
            Order {order.orderNumber} · Design {order.designNumber}
            {/* The record is on screen either way; this only says the log is
                still arriving, rather than replacing the panel with a spinner. */}
            {loading ? <span className="ml-2 text-brand-ink/40">refreshing…</span> : null}
          </p>
          {order.sampleNumber ? (
            <button
              type="button"
              onClick={() => onOpenSample?.(order.sample)}
              disabled={!onOpenSample}
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5
                         font-body text-[11px] font-semibold text-violet-700 enabled:hover:underline
                         disabled:cursor-default"
            >
              <FiLink aria-hidden size={11} /> From sample {order.sampleNumber}
            </button>
          ) : null}
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

      {/* progress */}
      <div>
        <div className="flex items-center justify-between font-body text-xs text-brand-ink/50">
          <span>
            {formatMetres(done)}m of {formatMetres(ordered)}m · {formatMetres(remaining)}m left
          </span>
          <span className="font-semibold text-brand-ink">{pct.toFixed(0)}%</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-brand-ink/8">
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
        {order.isOverdue ? (
          <p className="mt-2 font-body text-xs font-semibold text-rose-600">
            Overdue — the deadline of {formatDate(order.deadline)} has passed.
          </p>
        ) : null}
      </div>

      {/* status */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
          Status
        </span>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            disabled={busy || s === order.status}
            aria-pressed={s === order.status}
            className={`rounded-full px-3 py-1.5 font-body text-xs font-semibold transition-colors
                        disabled:cursor-default ${
                          s === order.status
                            ? STATUS_STYLES[s]
                            : 'text-brand-ink/50 ring-1 ring-brand-ink/12 hover:bg-brand-ink/5'
                        }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <dl className="grid gap-4 border-t border-brand-ink/8 pt-4 sm:grid-cols-3 lg:grid-cols-4">
        <Detail label="Fabric" value={order.fabricType} />
        <Detail label="Width" value={order.fabricWidth} />
        <Detail label="Yarn" value={order.yarnType} />
        <Detail label="Colour" value={order.yarnColor} />
        <Detail label="Repeat" value={order.repeat ? `${order.repeat}"` : ''} />
        <Detail
          label="Stitches / repeat"
          value={order.stitches ? Number(order.stitches).toLocaleString('en-IN') : ''}
        />
        <Detail label="Start" value={formatDate(order.startDate)} />
        <Detail label="Deadline" value={formatDate(order.deadline)} />
        <Detail label="Est. completion" value={formatDate(order.estCompletion)} />
        <Detail label="Machine" value={order.machine} />
        <Detail label="Operator" value={order.operator} />
        <Detail label="Mendings" value={String(order.mendings ?? 0)} />
        <Detail label="Rejected" value={`${formatMetres(order.rejectedMetres)}m`} />
      </dl>

      {order.remarks ? (
        <div className="rounded-xl bg-admin-cream p-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45">
            Remarks
          </p>
          <p className="mt-1 font-body text-sm text-brand-ink/80">{order.remarks}</p>
        </div>
      ) : null}

      {/* production log */}
      <div className="flex flex-col gap-3 border-t border-brand-ink/8 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            Production log
          </h3>
          {!logging ? (
            <button
              type="button"
              onClick={() => setLogging(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-pink px-3 py-2
                         font-body text-xs font-semibold text-on-primary transition-colors
                         hover:bg-brand-pink-dark"
            >
              <FiPlus aria-hidden /> Log production
            </button>
          ) : null}
        </div>

        {logging ? (
          <LogForm
            orderId={order._id}
            ordered={ordered}
            produced={done}
            setError={setError}
            onCancel={() => setLogging(false)}
            onLogged={(updated) => {
              setLogging(false);
              onChanged(updated);
            }}
          />
        ) : null}

        {log.length ? (
          <ul className="flex max-h-64 flex-col overflow-y-auto">
            {log.map((entry) => (
              <li
                key={entry._id}
                className="flex items-center justify-between gap-3 border-b border-brand-ink/8 py-2
                           last:border-0"
              >
                <span className="min-w-0">
                  <span className="font-body text-sm text-brand-ink">
                    {formatDate(entry.date)}
                  </span>
                  {entry.note ? (
                    <span className="ml-2 font-body text-xs text-brand-ink/50">{entry.note}</span>
                  ) : null}
                  <span className="mt-0.5 block font-body text-[11px] text-brand-ink/40">
                    {entry.loggedByName || 'Unknown'}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`font-body text-sm font-semibold ${
                      entry.metres < 0 ? 'text-rose-600' : 'text-brand-ink'
                    }`}
                  >
                    {entry.metres > 0 ? '+' : ''}
                    {formatMetres(entry.metres)}m
                  </span>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingEntry(entry)}
                      aria-label="Remove entry"
                      className="grid h-7 w-7 place-items-center rounded-full text-brand-ink/35
                                 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body text-sm text-brand-ink/45">
            Nothing logged yet. The total above comes from these entries.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-brand-ink/8 pt-4">
        <button
          type="button"
          onClick={() => onEdit(order)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm
                     font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                     transition-colors hover:bg-brand-ink/5 disabled:opacity-60"
        >
          <FiEdit2 aria-hidden /> Edit order
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

        {/* Destructive and irreversible, so it is owner-only — matching the
            API, which rejects a delete from anyone else. */}
        {isOwner ? (
          <button
            type="button"
            onClick={() => onDelete(order)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm
                       font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors
                       hover:bg-rose-50 disabled:opacity-60"
          >
            <FiTrash2 aria-hidden /> Delete order
          </button>
        ) : null}
      </div>
    </div>
  );
}
