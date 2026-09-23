import { useState } from 'react';
import * as stockApi from '../../../api/stock.api.js';
import { invalidate } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import {
  ENTRY_DIRECTIONS,
  DIRECTION_LABELS,
  inputClass,
  labelClass,
  today,
  toDateInput,
} from './constants.js';

/**
 * Record one movement against one item.
 *
 * Deliberately ONE direction per entry. A receipt and an issue are two separate
 * events with two different challans and two different parties; putting both on
 * one form meant half the fields were always blank and the row that came out
 * could not say which challan belonged to which movement.
 */
export default function MovementForm({ open, item, category, initial, onSaved, onCancel }) {
  const editing = Boolean(initial?._id);

  const [form, setForm] = useState(() => ({
    direction: initial?.direction ?? 'IN',
    quantity: initial?.quantity != null ? String(Math.abs(initial.quantity)) : '',
    date: initial?.date ? toDateInput(initial.date) : today(),
    challanNo: initial?.challanNo ?? '',
    partyName: initial?.partyName ?? '',
    note: initial?.note ?? '',
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  /* Breakage only exists where the category says it does — needles snap, yarn
     does not. The API refuses it too; this keeps the option off the screen. */
  const directions = ENTRY_DIRECTIONS.filter(
    (d) => d !== 'BREAK' || category?.allowsBreak
  );

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});

    const payload = {
      direction: form.direction,
      quantity: Number(form.quantity),
      date: form.date,
      challanNo: form.challanNo,
      partyName: form.partyName,
      note: form.note,
    };

    try {
      const result = editing
        ? await stockApi.editMovement(initial._id, payload)
        : await stockApi.createMovement({ itemId: item._id, ...payload });

      invalidate('stock-items', 'stock-movements', 'stock-summary', 'stock-report');

      /* The API returns a warning when the entry leaves the item short. The
         entry saved either way, so this is passed up as a notice, not an error. */
      onSaved(
        result.warning ?? (editing ? 'Entry corrected' : 'Entry saved'),
        Boolean(result.warning)
      );
    } catch (err) {
      setError(err?.message ?? 'Could not save that entry.');
      setFieldErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const formId = editing ? `movement-${initial._id}` : 'movement-new';
  const unit = item?.unit ?? '';

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onCancel}
      title={editing ? 'Correct this entry' : `${item?.name} — new entry`}
      description={
        editing
          ? 'The original stays in the ledger, marked reversed, with this entry beside it.'
          : 'One movement per entry. Record a receipt and an issue separately.'
      }
      size="md"
      closeOnBackdrop={false}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl px-4 py-2.5 font-body text-sm font-semibold text-brand-ink/70
                       ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                       disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="rounded-xl bg-brand-pink px-5 py-2.5 font-body text-sm font-semibold
                       text-on-primary transition-colors hover:bg-brand-pink-dark
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-brand-pink disabled:opacity-60"
          >
            {saving ? 'Saving…' : editing ? 'Save correction' : 'Save entry'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {/* A segmented control rather than a dropdown: there are three options,
            they are the most important choice on the form, and colour can carry
            the meaning. */}
        <fieldset>
          <legend className={labelClass}>Movement</legend>
          <div className="mt-1.5 flex gap-1 rounded-2xl bg-brand-ink/4 p-1">
            {directions.map((d) => {
              const active = form.direction === d;
              const tone =
                d === 'IN'
                  ? 'bg-emerald-600 text-white'
                  : d === 'OUT'
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-500 text-white';

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('direction', d)}
                  aria-pressed={active}
                  className={`flex-1 rounded-xl px-4 py-2.5 font-body text-sm font-semibold
                              transition-colors ${
                                active ? tone : 'text-brand-ink/55 hover:text-brand-ink'
                              }`}
                >
                  {DIRECTION_LABELS[d]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Quantity ({unit}) *</span>
            <input
              type="number"
              step="any"
              min="0"
              required
              autoFocus
              value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)}
              placeholder="0"
              className={`${inputClass} ${fieldErrors.quantity ? 'ring-rose-300' : ''}`}
            />
            {fieldErrors.quantity ? (
              <span className="text-xs text-rose-600">{fieldErrors.quantity}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={inputClass}
            />
          </label>

          {/* Breakage is stock destroyed in use — there is no docket and no
              counterparty, so those fields would only ever be blank. */}
          {form.direction !== 'BREAK' ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Challan no.</span>
                <input
                  type="text"
                  value={form.challanNo}
                  onChange={(e) => set('challanNo', e.target.value)}
                  placeholder="e.g. 1042"
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Party name</span>
                <input
                  type="text"
                  value={form.partyName}
                  onChange={(e) => set('partyName', e.target.value)}
                  placeholder={form.direction === 'IN' ? 'e.g. Tirupati' : 'e.g. Nahar'}
                  className={inputClass}
                />
              </label>
            </>
          ) : null}

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Note</span>
            <input
              type="text"
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Optional — e.g. machine 3, order #12"
              className={inputClass}
            />
          </label>
        </div>
      </form>
    </Modal>
  );
}
