import { useState } from 'react';
import * as stockApi from '../../../api/stock.api.js';
import { invalidate } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import { inputClass, labelClass } from './constants.js';

/**
 * Add or rename an item within a category.
 *
 * Categories are fixed — they carry their own units and rules — but what sits
 * inside one is exactly the thing that changes: a new yarn count, another
 * fabric width, some supply nobody had thought of.
 */
export default function ItemForm({ open, category, initial, onSaved, onCancel }) {
  const editing = Boolean(initial?._id);

  const [name, setName] = useState(initial?.name ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? category?.unit ?? '');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});

    try {
      if (editing) {
        await stockApi.updateItem(initial._id, { name, unit });
      } else {
        await stockApi.createItem({ category: category.key, name, unit });
      }

      invalidate('stock-items', 'stock-summary');
      onSaved(editing ? 'Item saved' : 'Item added');
    } catch (err) {
      setError(err?.message ?? 'Could not save that item.');
      setFieldErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const formId = editing ? `item-${initial._id}` : 'item-new';

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onCancel}
      title={editing ? `Rename ${initial.name}` : `Add to ${category?.label}`}
      description={
        editing
          ? 'Past entries keep the name they were recorded under.'
          : `A new item under ${category?.label}.`
      }
      size="sm"
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
                       disabled:opacity-60"
          >
            {saving ? 'Saving…' : editing ? 'Save' : 'Add item'}
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

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Item name *</span>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. 2/30 Yarn'
            className={`${inputClass} ${fieldErrors.name ? 'ring-rose-300' : ''}`}
          />
          {fieldErrors.name ? (
            <span className="text-xs text-rose-600">{fieldErrors.name}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Unit</span>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder={category?.unit}
            className={inputClass}
          />
          <span className="font-body text-xs text-brand-ink/45">
            Defaults to {category?.unit} for {category?.label?.toLowerCase()}.
          </span>
        </label>
      </form>
    </Modal>
  );
}

/**
 * Record a counted stock figure.
 *
 * Separate from the movement form because it is a different act: not "this
 * arrived" but "I have counted, and this is what is actually there". The
 * difference against the ledger is written as its own entry, so a figure typed
 * by hand is as traceable as one built from dockets.
 */
export function BalanceForm({ open, item, onSaved, onCancel }) {
  const [balance, setBalance] = useState(String(item?.balance ?? 0));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await stockApi.setBalance(item._id, Number(balance), note);
      invalidate('stock-items', 'stock-movements', 'stock-summary', 'stock-report');
      onSaved('Stock updated');
    } catch (err) {
      setError(err?.message ?? 'Could not update that stock figure.');
    } finally {
      setSaving(false);
    }
  };

  const difference = Number(balance) - Number(item?.balance ?? 0);

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onCancel}
      title={`Count ${item?.name}`}
      description="The difference is recorded as a correction entry."
      size="sm"
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
            form="balance-form"
            disabled={saving}
            className="rounded-xl bg-brand-pink px-5 py-2.5 font-body text-sm font-semibold
                       text-on-primary transition-colors hover:bg-brand-pink-dark
                       disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Set stock'}
          </button>
        </>
      }
    >
      <form id="balance-form" onSubmit={submit} className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <p className="font-body text-sm text-brand-ink/60">
          The ledger says{' '}
          <strong className="text-brand-ink">
            {item?.balance} {item?.unit}
          </strong>
          .
        </p>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Counted stock ({item?.unit}) *</span>
          <input
            type="number"
            step="any"
            required
            autoFocus
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className={inputClass}
          />
        </label>

        {difference !== 0 && Number.isFinite(difference) ? (
          <p className="font-body text-xs text-brand-ink/55">
            That is a correction of{' '}
            <strong className={difference > 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {difference > 0 ? '+' : ''}
              {difference} {item?.unit}
            </strong>
            , which will be recorded in the ledger.
          </p>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Reason</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional — e.g. physical count, 23 Sep"
            className={inputClass}
          />
        </label>
      </form>
    </Modal>
  );
}
