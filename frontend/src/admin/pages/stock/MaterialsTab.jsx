import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiEdit2, FiRotateCcw, FiPackage, FiSliders } from 'react-icons/fi';
import * as stockApi from '../../../api/stock.api.js';
import { useCachedQuery, cacheKey, invalidate } from '../../../api/useCachedQuery.js';
import { useAppStore } from '../../../store/useAppStore.js';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import MovementForm from './MovementForm.jsx';
import ItemForm, { BalanceForm } from './ItemForm.jsx';
import {
  MAIN_ADMIN,
  DIRECTION_LABELS,
  DIRECTION_STYLES,
  DIRECTION_SIGN,
  formatDate,
  formatQuantity,
} from './constants.js';

/** A scrolling row of pills — categories, then the items within one. */
function PillRow({ options, active, onSelect, onAdd, addLabel }) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onSelect(o.key)}
          aria-pressed={active === o.key}
          className={`shrink-0 rounded-xl px-3.5 py-2 font-body text-xs font-semibold
                      transition-colors ${
                        active === o.key
                          ? 'bg-brand-pink text-on-primary'
                          : 'text-brand-ink/60 ring-1 ring-brand-ink/12 hover:bg-brand-ink/5'
                      }`}
        >
          {o.label}
          {o.badge ? (
            <span className="ml-1.5 text-[10px] font-bold opacity-70">{o.badge}</span>
          ) : null}
        </button>
      ))}

      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-xl border border-dashed border-brand-pink/50 px-3.5 py-2
                     font-body text-xs font-semibold text-brand-pink transition-colors
                     hover:bg-brand-pink/8"
        >
          + {addLabel}
        </button>
      ) : null}
    </div>
  );
}

/** One row of the ledger. */
function MovementRow({ movement, isOwner, onEdit, onReverse }) {
  const reversed = movement.isReversed;
  const isReversal = Boolean(movement.reversalOf);
  const meta = [formatDate(movement.date)];

  if (movement.partyName) meta.push(movement.partyName);
  if (movement.challanNo) meta.push(`Challan #${movement.challanNo}`);
  if (movement.note) meta.push(movement.note);
  if (movement.createdByName) meta.push(movement.createdByName);

  return (
    <li
      className={`flex items-start justify-between gap-3 border-b border-brand-ink/8 py-3
                  last:border-0 ${reversed ? 'opacity-55' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold uppercase
                        tracking-wider ${DIRECTION_STYLES[movement.direction]}`}
          >
            {DIRECTION_LABELS[movement.direction]}
          </span>

          <span
            className={`font-body text-sm font-bold ${
              reversed ? 'text-brand-ink/50 line-through' : 'text-brand-ink'
            }`}
          >
            {DIRECTION_SIGN[movement.direction]}
            {formatQuantity(Math.abs(movement.quantity))} {movement.unit}
          </span>

          {reversed ? (
            <span className="font-body text-[11px] font-semibold text-rose-600">reversed</span>
          ) : null}
          {isReversal ? (
            <span className="font-body text-[11px] font-semibold text-brand-ink/45">
              correction
            </span>
          ) : null}
        </div>

        <p className="mt-1 font-body text-[11px] text-brand-ink/50">{meta.join(' · ')}</p>
      </div>

      {/* A reversed row, and a reversal itself, are settled history — there is
          nothing left to correct on either. */}
      {!reversed && !isReversal && movement.direction !== 'CORRECTION' ? (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(movement)}
            aria-label="Correct this entry"
            className="grid h-8 w-8 place-items-center rounded-full text-brand-ink/40
                       transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
          >
            <FiEdit2 size={13} />
          </button>
          {isOwner ? (
            <button
              type="button"
              onClick={() => onReverse(movement)}
              aria-label="Reverse this entry"
              className="grid h-8 w-8 place-items-center rounded-full text-brand-ink/40
                         transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <FiRotateCcw size={13} />
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export default function MaterialsTab() {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  const [category, setCategory] = useState(null);
  const [itemId, setItemId] = useState(null);
  const [note, setNote] = useState('');
  const [noteTone, setNoteTone] = useState('good');
  const [entryFor, setEntryFor] = useState(null); // null | 'new' | movement
  const [itemForm, setItemForm] = useState(null); // null | 'new' | item
  const [balanceFor, setBalanceFor] = useState(null);
  const [reversing, setReversing] = useState(null);
  const [error, setError] = useState('');

  const flash = (message, warn = false) => {
    setNote(message);
    setNoteTone(warn ? 'warn' : 'good');
    // A warning is a thing to act on, so it stays up longer than a receipt.
    setTimeout(() => setNote(''), warn ? 6000 : 2500);
  };

  const { data, loading } = useCachedQuery(cacheKey('stock-items', {}), () =>
    stockApi.listItems()
  );

  /*
   * Memoised, not `data?.x ?? []` inline: a fresh array literal every render
   * would be a new dependency every render, and the effect below would then
   * re-run in a loop.
   */
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const items = useMemo(() => data?.items ?? [], [data]);

  /* Land on the first category that has anything in it, once loaded. */
  useEffect(() => {
    if (category || !categories.length) return;
    const withItems = categories.find((c) => items.some((i) => i.category === c.key));
    setCategory((withItems ?? categories[0]).key);
  }, [categories, items, category]);

  const activeCategory = categories.find((c) => c.key === category);
  const categoryItems = items.filter((i) => i.category === category);

  /* Keep the selected item valid as the category changes beneath it. */
  const activeItem =
    categoryItems.find((i) => i._id === itemId) ?? categoryItems[0] ?? null;

  const { data: ledger } = useCachedQuery(
    activeItem ? cacheKey('stock-movements', { itemId: activeItem._id, limit: 50 }) : null,
    () => stockApi.listMovements({ itemId: activeItem._id, limit: 50 })
  );

  const reverse = async () => {
    try {
      await stockApi.reverseMovement(reversing._id);
      invalidate('stock-items', 'stock-movements', 'stock-summary', 'stock-report');
      setReversing(null);
      flash('Entry reversed');
    } catch (err) {
      setError(err?.message ?? 'Could not reverse that entry.');
      setReversing(null);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner label="Loading materials" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PillRow
        options={categories.map((c) => ({
          key: c.key,
          label: c.label,
          badge: items.filter((i) => i.category === c.key).length || undefined,
        }))}
        active={category}
        onSelect={(key) => {
          setCategory(key);
          setItemId(null);
        }}
      />

      {activeCategory ? (
        <PillRow
          options={categoryItems.map((i) => ({
            key: i._id,
            label: i.name,
            badge: i.needsCorrection ? '!' : undefined,
          }))}
          active={activeItem?._id}
          onSelect={setItemId}
          /* A singleton category holds one pooled figure — there is nothing
             to add to it. */
          onAdd={activeCategory.isSingleton ? undefined : () => setItemForm('new')}
          addLabel="Add item"
        />
      ) : null}

      {note ? (
        <p
          role="status"
          className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
            noteTone === 'warn'
              ? 'bg-amber-50 text-amber-800'
              : 'text-emerald-600'
          }`}
        >
          {note}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {activeItem ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wider text-brand-ink/50">
                {activeItem.name} — in stock
              </p>
              <p
                className={`mt-1 font-body text-3xl font-bold ${
                  activeItem.balance < 0 ? 'text-rose-600' : 'text-brand-ink'
                }`}
              >
                {formatQuantity(activeItem.balance)}{' '}
                <span className="text-sm font-medium text-brand-ink/45">
                  {activeItem.unit}
                </span>
              </p>
              {activeItem.needsCorrection ? (
                <p className="mt-1 font-body text-xs font-semibold text-rose-600">
                  More went out than the ledger knew about — count this and set the figure.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBalanceFor(activeItem)}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-body
                           text-sm font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                           transition-colors hover:bg-brand-ink/5"
              >
                <FiSliders aria-hidden /> Count stock
              </button>
              {!activeCategory?.isSingleton ? (
                <button
                  type="button"
                  onClick={() => setItemForm(activeItem)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-body
                             text-sm font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                             transition-colors hover:bg-brand-ink/5"
                >
                  <FiEdit2 aria-hidden /> Rename
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setEntryFor('new')}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-pink px-5 py-2.5
                           font-body text-sm font-semibold text-on-primary transition-colors
                           hover:bg-brand-pink-dark"
              >
                <FiPlus aria-hidden /> New entry
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
              Ledger
            </h2>

            {ledger?.items?.length ? (
              <ul className="mt-2 flex flex-col">
                {ledger.items.map((m) => (
                  <MovementRow
                    key={m._id}
                    movement={m}
                    isOwner={isOwner}
                    onEdit={setEntryFor}
                    onReverse={setReversing}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-3 font-body text-sm text-brand-ink/45">
                Nothing recorded yet. The stock figure above comes from these entries.
              </p>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          className="min-h-[40vh] bg-surface-card"
          icon={FiPackage}
          title={`No items under ${activeCategory?.label ?? 'this category'}`}
          hint="Add one to start tracking what comes in and goes out."
        />
      )}

      {entryFor ? (
        <MovementForm
          open
          key={entryFor === 'new' ? 'new' : entryFor._id}
          item={activeItem}
          category={activeCategory}
          initial={entryFor === 'new' ? null : entryFor}
          onCancel={() => setEntryFor(null)}
          onSaved={(message, warn) => {
            setEntryFor(null);
            flash(message, warn);
          }}
        />
      ) : null}

      {itemForm ? (
        <ItemForm
          open
          key={itemForm === 'new' ? 'new' : itemForm._id}
          category={activeCategory}
          initial={itemForm === 'new' ? null : itemForm}
          onCancel={() => setItemForm(null)}
          onSaved={(message) => {
            setItemForm(null);
            flash(message);
          }}
        />
      ) : null}

      {balanceFor ? (
        <BalanceForm
          open
          key={balanceFor._id}
          item={balanceFor}
          onCancel={() => setBalanceFor(null)}
          onSaved={(message) => {
            setBalanceFor(null);
            flash(message);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(reversing)}
        title="Reverse this entry?"
        message={
          reversing
            ? `A matching entry of ${formatQuantity(Math.abs(reversing.quantity))} ${
                reversing.unit
              } will be written to cancel it. Both stay in the ledger, so the history shows what happened.`
            : ''
        }
        confirmLabel="Reverse entry"
        onConfirm={reverse}
        onCancel={() => setReversing(null)}
      />
    </div>
  );
}
