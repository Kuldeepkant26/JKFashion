import { useState } from 'react';
import { FiX, FiEdit2, FiTrash2, FiPlus, FiImage } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import Spinner from '../../components/Spinner.jsx';
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

/** Add a day's production. Inline rather than a modal — it is two fields. */
function LogForm({ orderId, onLogged, onCancel, setError }) {
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
  setError,
}) {
  const [logging, setLogging] = useState(false);

  if (loading || !order) {
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

  const removeEntry = async (entry) => {
    if (!window.confirm(`Remove this entry of ${formatMetres(entry.metres)}m?`)) return;
    setError('');
    try {
      onChanged(await inventoryApi.deleteLogEntry(order._id, entry._id));
    } catch (err) {
      setError(err?.message ?? 'Could not remove that entry.');
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        {order.designImage?.url ? (
          <img
            src={order.designImage.url}
            alt=""
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
                      onClick={() => removeEntry(entry)}
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
