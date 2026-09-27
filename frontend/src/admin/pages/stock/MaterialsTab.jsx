import { useEffect, useMemo, useRef, useState } from 'react';
import { FiPlus, FiPackage, FiChevronRight } from 'react-icons/fi';
import * as stockApi from '../../../api/stock.api.js';
import { useCachedQuery, cacheKey, invalidate } from '../../../api/useCachedQuery.js';
import { useAppStore } from '../../../store/useAppStore.js';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import MovementForm from './MovementForm.jsx';
import ItemForm, { BalanceForm } from './ItemForm.jsx';
import StockItemPopup from './StockItemPopup.jsx';
import { MAIN_ADMIN, formatQuantity } from './constants.js';

const sectionLabel =
  'font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink/45';

/**
 * The categories, as their own clearly labelled panel.
 *
 * A vertical list beside the items on a wide screen, a compact grid above them
 * on a phone — never a sideways-scrolling row, which hid whatever did not fit
 * and made categories look exactly like the items inside them. Every button is
 * the same size in every state: the selected one changes colour, not shape.
 */
function CategoryNav({ categories, items, active, onSelect }) {
  return (
    <nav
      aria-label="Categories"
      className="rounded-2xl bg-surface-card p-3 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-4"
    >
      <p className={`${sectionLabel} px-1 pb-2`}>Categories</p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-1 lg:gap-1">
        {categories.map((c) => {
          const inCategory = items.filter((i) => i.category === c.key);
          const flagged = inCategory.some((i) => i.needsCorrection);
          const selected = c.key === active;

          return (
            <li key={c.key} className="flex">
              <button
                type="button"
                onClick={() => onSelect(c.key)}
                aria-current={selected ? 'true' : undefined}
                className={`flex w-full flex-col items-center justify-center gap-0.5 rounded-xl border
                            px-2 py-2.5 text-center transition-colors lg:flex-row lg:justify-between
                            lg:px-3 lg:text-left ${
                              selected
                                ? 'border-brand-pink/40 bg-brand-pink/10 text-brand-pink'
                                : 'border-brand-ink/10 text-brand-ink/75 hover:bg-brand-ink/5 lg:border-transparent'
                            }`}
              >
                <span className="font-body text-sm font-semibold">{c.label}</span>
                <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-semibold opacity-70">
                  {flagged ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500">
                      <span className="sr-only">Needs a count</span>
                    </span>
                  ) : null}
                  {inCategory.length} {inCategory.length === 1 ? 'item' : 'items'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** One material, as a card: what it is and how much is left. Opens its popup. */
function ItemCard({ item, onOpen }) {
  const flagged = item.needsCorrection;

  return (
    <li className="flex">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={`flex w-full flex-col gap-2 rounded-2xl bg-surface-card p-4 text-left shadow-sm
                    ring-1 transition hover:ring-brand-pink/40 focus-visible:outline-2
                    focus-visible:outline-offset-2 focus-visible:outline-brand-pink ${
                      flagged ? 'ring-rose-200' : 'ring-black/5'
                    }`}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 font-body text-sm font-semibold text-brand-ink">{item.name}</span>
          <FiChevronRight aria-hidden className="mt-0.5 shrink-0 text-brand-ink/30" />
        </span>

        <span
          className={`font-body text-2xl font-bold ${
            item.balance < 0 ? 'text-rose-600' : 'text-brand-ink'
          }`}
        >
          {formatQuantity(item.balance)}{' '}
          <span className="text-xs font-medium text-brand-ink/45">{item.unit}</span>
        </span>

        <span
          className={`mt-auto font-body text-xs font-semibold ${
            flagged ? 'text-rose-600' : 'text-brand-ink/45'
          }`}
        >
          {flagged ? 'Needs a count' : 'View entries'}
        </span>
      </button>
    </li>
  );
}

/**
 * Materials: pick a category, see its items and their stock, open one to
 * record what came in or went out.
 *
 * Two levels on the page — the category panel and the item cards — and the
 * item's own ledger in a popup, so which is which is never in doubt.
 */
export default function MaterialsTab() {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  const [category, setCategory] = useState(null);
  const [openItemId, setOpenItemId] = useState(null);
  const [note, setNote] = useState('');
  const [noteTone, setNoteTone] = useState('good');
  const [entryFor, setEntryFor] = useState(null); // null | 'new' | movement
  const [itemForm, setItemForm] = useState(null); // null | 'new' | item
  const [balanceFor, setBalanceFor] = useState(null);
  const [reversing, setReversing] = useState(null);
  const [error, setError] = useState('');

  /*
   * One timer for the current message. Each new message cancels the last
   * one's timer, or an earlier receipt's countdown would wipe a newer message
   * — "Entry reversed" vanishing moments after it appeared.
   */
  const noteTimer = useRef(null);
  useEffect(() => () => clearTimeout(noteTimer.current), []);

  const flash = (message, warn = false) => {
    clearTimeout(noteTimer.current);
    setNote(message);
    setNoteTone(warn ? 'warn' : 'good');
    // A warning is a thing to act on, so it stays up longer than a receipt.
    noteTimer.current = setTimeout(() => setNote(''), warn ? 6000 : 2500);
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

  /*
   * Read from the live list rather than kept as a copy, so the popup's stock
   * figure moves the moment an entry is saved and the list refreshes.
   */
  const openItem = items.find((i) => i._id === openItemId) ?? null;
  const openCategory = openItem ? categories.find((c) => c.key === openItem.category) : null;

  const openPopup = (item) => {
    setError('');
    setOpenItemId(item._id);
  };

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
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-6">
      <CategoryNav
        categories={categories}
        items={items}
        active={category}
        onSelect={setCategory}
      />

      <section aria-labelledby="materials-category" className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={sectionLabel}>Category</p>
            <h2
              id="materials-category"
              className="font-display text-2xl font-bold tracking-tight text-brand-ink"
            >
              {activeCategory?.label}
            </h2>
            {activeCategory ? (
              <p className="font-body text-xs text-brand-ink/55">
                {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'} · counted
                in {activeCategory.unit}
              </p>
            ) : null}
          </div>

          {/* A singleton category holds one pooled figure — there is nothing
              to add to it. */}
          {activeCategory && !activeCategory.isSingleton ? (
            <button
              type="button"
              onClick={() => setItemForm('new')}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-body text-sm
                         font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12 transition-colors
                         hover:bg-brand-ink/5"
            >
              <FiPlus aria-hidden /> Add item
            </button>
          ) : null}
        </div>

        {/* Behind a popup this is out of sight, so the popup shows it too. */}
        {note && !openItem ? (
          <p
            role="status"
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
              noteTone === 'warn' ? 'bg-amber-50 text-amber-800' : 'text-emerald-600'
            }`}
          >
            {note}
          </p>
        ) : null}

        {error && !openItem ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {categoryItems.length ? (
          <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {categoryItems.map((item) => (
              <ItemCard key={item._id} item={item} onOpen={openPopup} />
            ))}
          </ul>
        ) : (
          <EmptyState
            className="min-h-[30vh] bg-surface-card"
            icon={FiPackage}
            title={`No items under ${activeCategory?.label ?? 'this category'}`}
            hint="Click Add item to start tracking what comes in and goes out."
          />
        )}
      </section>

      {openItem ? (
        <StockItemPopup
          item={openItem}
          category={openCategory}
          isOwner={isOwner}
          note={note}
          noteTone={noteTone}
          error={error}
          onClose={() => {
            setOpenItemId(null);
            setError('');
          }}
          onNewEntry={() => setEntryFor('new')}
          onEditEntry={setEntryFor}
          onReverse={setReversing}
          onCount={() => setBalanceFor(openItem)}
          onRename={openCategory?.isSingleton ? undefined : () => setItemForm(openItem)}
        />
      ) : null}

      {entryFor && openItem ? (
        <MovementForm
          open
          key={entryFor === 'new' ? 'new' : entryFor._id}
          item={openItem}
          category={openCategory}
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
          category={itemForm === 'new' ? activeCategory : openCategory}
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
