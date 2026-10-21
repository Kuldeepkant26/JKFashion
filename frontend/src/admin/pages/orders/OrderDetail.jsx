import { useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiImage, FiLink } from 'react-icons/fi';
import { TbCalculator } from 'react-icons/tb';
import * as inventoryApi from '../../../api/inventory.api.js';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import StitchCalculator from './StitchCalculator.jsx';
import FabricList from './FabricList.jsx';
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  formatMetres,
  formatThans,
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
 * Add a day's production. Inline rather than a modal — it is a handful of fields.
 *
 * Shows what is left on the order and what this entry would leave, so the
 * person logging sees Ordered − Produced = Remaining as they type.
 *
 * The design number starts as the order's own, since that is nearly always
 * what was run; it can be changed for an entry where it was not.
 */
function LogForm({
  orderId,
  orderDesign,
  ordered,
  produced,
  status,
  onLogged,
  onCancel,
  setError,
}) {
  const [thans, setThans] = useState('');
  const [metres, setMetres] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [designNumber, setDesignNumber] = useState(orderDesign ?? '');
  const [poNumber, setPoNumber] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await inventoryApi.logProduction(orderId, {
        metres: Number(metres),
        // Optional — left out when blank rather than sent as 0.
        thans: thans === '' ? undefined : Number(thans),
        date,
        designNumber,
        poNumber,
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
            Thans
          </span>
          <input
            type="number"
            step="any"
            autoFocus
            value={thans}
            onChange={(e) => setThans(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            Metres *
          </span>
          <input
            type="number"
            step="0.1"
            required
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
            Design no.
          </span>
          <input
            type="text"
            maxLength={60}
            value={designNumber}
            onChange={(e) => setDesignNumber(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </label>

        {/* Text, not a number input: P.O. numbers mix letters and digits. */}
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            P.O. no.
          </span>
          <input
            type="text"
            maxLength={60}
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            className={inputClass}
            placeholder="e.g. PO-4521"
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

      {/* Said before saving, so the status change is never a surprise. */}
      {status !== 'COMPLETED' && Number(metres) > 0 && produced + Number(metres) >= ordered ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 font-body text-xs font-semibold text-emerald-700">
          This entry reaches the ordered quantity — the order will be marked Completed.
        </p>
      ) : null}

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

const secondaryButton =
  'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm font-semibold ' +
  'text-brand-ink/70 ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5 ' +
  'disabled:opacity-60';

/**
 * One order, in a popup: progress, status, the design, and the production log.
 *
 * The status is shown, not set, here. It changes in Edit order with the other
 * fields — a one-click pill in the popup was too easy to hit by accident. (The
 * log still moves it to Completed and back on its own, and says so.)
 *
 * A popup rather than a panel opened inside the list: the list stays where it
 * was, and the record gets the whole screen's attention while it is open. The
 * calculator and the confirmations open over it, not in place of it.
 */
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
  error,
  setError,
}) {
  const [logging, setLogging] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [confirmingEntry, setConfirmingEntry] = useState(null);

  /*
   * Said when the server moves the status because the total crossed the
   * ordered quantity — the pill changing on its own would otherwise look like
   * a glitch.
   */
  const [notice, setNotice] = useState('');

  /** Pass on a changed order, saying so if its total moved its status. */
  const afterTotalChanged = (updated) => {
    if (updated.status === 'COMPLETED' && order.status !== 'COMPLETED') {
      setNotice('Ordered quantity reached — the order is marked Completed.');
    } else if (order.status === 'COMPLETED' && updated.status !== 'COMPLETED') {
      setNotice('Below the ordered quantity again — the order is back to Running.');
    } else {
      setNotice('');
    }
    onChanged(updated);
  };

  const ordered = Number(order.orderedMetres ?? 0);
  const done = Number(order.completedMetres ?? 0);
  const remaining = Math.max(0, ordered - done);
  const pct = ordered > 0 ? Math.min(100, (done / ordered) * 100) : 0;
  const log = order.log ?? [];

  const removeEntry = async () => {
    setError('');
    try {
      afterTotalChanged(await inventoryApi.deleteLogEntry(order._id, confirmingEntry._id));
      setConfirmingEntry(null);
    } catch (err) {
      setError(err?.message ?? 'Could not remove that entry.');
      setConfirmingEntry(null);
    }
  };

  return (
    <>
      <Modal
        error={error}
        open
        onClose={onClose}
        focusFirstControl={false}
        title={`Order ${order.orderNumber}`}
        description={`${order.companyName} · Design ${order.designNumber}${
          // The record is on screen either way; this only says the log is
          // still arriving, rather than blanking the popup with a spinner.
          loading ? ' · refreshing…' : ''
        }`}
        footer={
          <>
            {/* Destructive and irreversible, so it is owner-only — matching the
                API, which rejects a delete from anyone else. */}
            {isOwner ? (
              <button
                type="button"
                onClick={() => onDelete(order)}
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
              onClick={() => onEdit(order)}
              disabled={busy}
              className={secondaryButton}
            >
              <FiEdit2 aria-hidden /> Edit order
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5">

          <div className="flex items-start gap-4">
            {order.designImage?.url ? (
              <img
                src={order.designImage.url}
                alt={`Design ${order.designNumber}`}
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
              <p className="font-display text-lg font-bold text-brand-ink">{order.companyName}</p>
              <p className="font-body text-xs text-brand-ink/50">Design {order.designNumber}</p>
              {order.sampleNumber ? (
                <button
                  type="button"
                  onClick={() => onOpenSample?.(order.sample)}
                  disabled={!onOpenSample}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5
                             font-body text-[11px] font-semibold text-violet-700 enabled:hover:underline
                             disabled:cursor-default"
                >
                  <FiLink aria-hidden size={11} /> From sample {order.sampleNumber}
                </button>
              ) : null}
            </div>
          </div>

          {/* progress */}
          <div>
            <div className="flex items-center justify-between font-body text-xs text-brand-ink/60">
              <span>
                {formatMetres(ordered)}m ordered − {formatMetres(done)}m produced ={' '}
                <b className="text-brand-ink">{formatMetres(remaining)}m remaining</b>
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

          {/* status — read only; it is changed in Edit order */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
              Status
            </span>
            <span
              className={`rounded-full px-3 py-1.5 font-body text-xs font-semibold ${
                STATUS_STYLES[order.status] ?? ''
              }`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
            <span className="font-body text-xs text-brand-ink/45">Change it in Edit order.</span>
          </div>

          <FabricList rows={order.fabrics} />

          <dl className="grid grid-cols-2 gap-4 border-t border-brand-ink/8 pt-4 sm:grid-cols-4">
            <Detail label="Repeat" value={order.repeat ? String(order.repeat) : ''} />
            <Detail
              label="Stitches"
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

            {/* Where the entry was just made — on a phone the top of the popup
                is scrolled out of sight by now. */}
            {notice ? (
              <p
                role="status"
                className="rounded-lg bg-emerald-50 px-3 py-2.5 font-body text-sm font-semibold text-emerald-700"
              >
                {notice}
              </p>
            ) : null}

            {logging ? (
              <LogForm
                orderId={order._id}
                orderDesign={order.designNumber}
                ordered={ordered}
                produced={done}
                status={order.status}
                setError={setError}
                onCancel={() => setLogging(false)}
                onLogged={(updated) => {
                  setLogging(false);
                  afterTotalChanged(updated);
                }}
              />
            ) : null}

            {log.length ? (
              <ul className="flex flex-col">
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
                      {/* Only entries logged since these were asked for carry them. */}
                      {entry.designNumber ? (
                        <span className="ml-2 inline-block font-body text-xs font-semibold text-brand-ink/70">
                          Design {entry.designNumber}
                        </span>
                      ) : null}
                      {entry.poNumber ? (
                        <span className="ml-2 inline-block font-body text-xs font-semibold text-brand-ink/70">
                          P.O. {entry.poNumber}
                        </span>
                      ) : null}
                      {entry.note ? (
                        <span className="ml-2 font-body text-xs text-brand-ink/50">{entry.note}</span>
                      ) : null}
                      <span className="mt-0.5 block font-body text-[11px] text-brand-ink/40">
                        {entry.loggedByName || 'Unknown'}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      {entry.thans ? (
                        <span
                          className={`font-body text-xs ${
                            entry.thans < 0 ? 'text-rose-600' : 'text-brand-ink/60'
                          }`}
                        >
                          {formatThans(entry.thans)}
                        </span>
                      ) : null}
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
                {loading
                  ? 'Loading the log…'
                  : 'Nothing logged yet. The total above comes from these entries.'}
              </p>
            )}
          </div>
        </div>
      </Modal>

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
    </>
  );
}
