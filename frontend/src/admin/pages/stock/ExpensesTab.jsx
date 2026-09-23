import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCreditCard } from 'react-icons/fi';
import * as stockApi from '../../../api/stock.api.js';
import { useCachedQuery, cacheKey, invalidate } from '../../../api/useCachedQuery.js';
import { useAppStore } from '../../../store/useAppStore.js';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import {
  MAIN_ADMIN,
  formatDate,
  formatRupees,
  formatRupeesShort,
  toRupees,
  inputClass,
  labelClass,
  today,
  toDateInput,
} from './constants.js';

function ExpenseForm({ open, initial, onSaved, onCancel }) {
  const editing = Boolean(initial?._id);

  const [form, setForm] = useState(() => ({
    date: initial?.date ? toDateInput(initial.date) : today(),
    description: initial?.description ?? '',
    // Paise on the wire, rupees in the field — see constants/money.js.
    amount: initial ? String(toRupees(initial.amountPaise)) : '',
  }));
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});

    const payload = {
      date: form.date,
      description: form.description,
      amount: Number(form.amount),
    };

    try {
      if (editing) await stockApi.updateExpense(initial._id, payload);
      else await stockApi.createExpense(payload);

      invalidate('stock-expenses', 'stock-summary', 'stock-report');
      onSaved(editing ? 'Expense saved' : 'Expense added');
    } catch (err) {
      setError(err?.message ?? 'Could not save that expense.');
      setFieldErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  const formId = editing ? `expense-${initial._id}` : 'expense-new';

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onCancel}
      title={editing ? 'Edit expense' : 'New expense'}
      description="Costs that are not material — transport, job work, repairs."
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
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add expense'}
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
          <span className={labelClass}>Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Description *</span>
          <input
            type="text"
            required
            autoFocus
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="e.g. transport, dyeing job work"
            className={`${inputClass} ${fieldErrors.description ? 'ring-rose-300' : ''}`}
          />
          {fieldErrors.description ? (
            <span className="text-xs text-rose-600">{fieldErrors.description}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Amount (₹) *</span>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="0.00"
            className={`${inputClass} ${fieldErrors.amount ? 'ring-rose-300' : ''}`}
          />
          {fieldErrors.amount ? (
            <span className="text-xs text-rose-600">{fieldErrors.amount}</span>
          ) : null}
        </label>
      </form>
    </Modal>
  );
}

export default function ExpensesTab() {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const flash = (message) => {
    setNote(message);
    setTimeout(() => setNote(''), 2500);
  };

  const params = { page, limit: 50 };
  const { data, loading } = useCachedQuery(cacheKey('stock-expenses', params), () =>
    stockApi.listExpenses(params)
  );

  const remove = async () => {
    try {
      await stockApi.deleteExpense(confirming._id);
      invalidate('stock-expenses', 'stock-summary', 'stock-report');
      setConfirming(null);
      flash('Expense deleted');
    } catch (err) {
      setError(err?.message ?? 'Could not delete that expense.');
      setConfirming(null);
    }
  };

  const items = data?.items ?? [];
  const totals = data?.totals ?? { month: 0, allTime: 0 };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-brand-ink/50">
            Expenses this month
          </p>
          <p className="mt-1 font-body text-3xl font-bold text-brand-ink">
            {formatRupeesShort(totals.month)}
          </p>
          <p className="mt-1 font-body text-xs text-brand-ink/50">
            All-time {formatRupeesShort(totals.allTime)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-pink px-5 py-2.5
                     font-body text-sm font-semibold text-on-primary transition-colors
                     hover:bg-brand-pink-dark"
        >
          <FiPlus aria-hidden /> Add expense
        </button>
      </div>

      {note ? (
        <p role="status" className="text-sm font-semibold text-emerald-600">
          {note}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <Spinner label="Loading expenses" />
        </div>
      ) : items.length ? (
        <div className="rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
            History
          </h2>
          <ul className="mt-2 flex flex-col">
            {items.map((e) => (
              <li
                key={e._id}
                className="flex items-center justify-between gap-3 border-b border-brand-ink/8
                           py-3 last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-sm text-brand-ink">
                    {e.description}
                  </span>
                  <span className="font-body text-[11px] text-brand-ink/45">
                    {formatDate(e.date)}
                    {e.createdByName ? ` · ${e.createdByName}` : ''}
                  </span>
                </span>

                <span className="shrink-0 font-body text-sm font-bold text-brand-ink">
                  {formatRupees(e.amountPaise)}
                </span>

                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(e)}
                    aria-label="Edit expense"
                    className="grid h-8 w-8 place-items-center rounded-full text-brand-ink/40
                               transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
                  >
                    <FiEdit2 size={13} />
                  </button>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => setConfirming(e)}
                      aria-label="Delete expense"
                      className="grid h-8 w-8 place-items-center rounded-full text-brand-ink/40
                                 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          {data.pages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl px-4 py-2.5 font-body text-sm font-semibold text-brand-ink/70
                           ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                           disabled:opacity-40"
              >
                Previous
              </button>
              <p className="font-body text-sm text-brand-ink/50">
                Page {data.page} of {data.pages}
              </p>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="rounded-xl px-4 py-2.5 font-body text-sm font-semibold text-brand-ink/70
                           ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                           disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          className="min-h-[30vh] bg-surface-card"
          icon={FiCreditCard}
          title="No expenses logged yet"
          hint="Transport, job work, repairs — anything paid for that does not arrive as material."
        />
      )}

      {editing ? (
        <ExpenseForm
          open
          key={editing === 'new' ? 'new' : editing._id}
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            flash(message);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete this expense?"
        message={
          confirming
            ? `${confirming.description} — ${formatRupees(
                confirming.amountPaise
              )} will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete expense"
        onConfirm={remove}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
