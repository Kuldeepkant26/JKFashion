import { useState } from 'react';
import { FiPlus, FiEdit2, FiRotateCcw, FiSliders, FiChevronDown } from 'react-icons/fi';
import * as stockApi from '../../../api/stock.api.js';
import { useCachedQuery, cacheKey } from '../../../api/useCachedQuery.js';
import Modal from '../../components/Modal.jsx';
import {
  DIRECTION_LABELS,
  DIRECTION_STYLES,
  DIRECTION_SIGN,
  formatDate,
  formatQuantity,
} from './constants.js';

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

/*
 * On a phone the three actions do not fit on one line, so the main one — New
 * entry — takes the full width on top and the other two share the row below.
 * From `sm` up they sit in one row: Count stock on the left, the rest right.
 */
const secondaryButton =
  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 font-body ' +
  'text-sm font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12 transition-colors ' +
  'hover:bg-brand-ink/5 sm:flex-none';

/**
 * One material, in a popup: how much is in stock and what to do about it —
 * with every entry that made the figure, the ledger, one tap away.
 *
 * A popup rather than a third row of controls on the page: the page then has
 * two clear levels — categories, and the items in one — and the item itself
 * gets the whole screen while it is open, as orders and samples do. Entry
 * forms and confirmations open over it, not in place of it.
 *
 * The ledger is closed each time the popup opens. Day to day the figure and
 * New entry are what is wanted; the history is there when asked for, and is
 * not even fetched until then.
 *
 * @param note/noteTone the latest receipt or warning — the page's own banner
 *                      sits behind the backdrop while this is open
 */
export default function StockItemPopup({
  item,
  category,
  isOwner,
  note,
  noteTone,
  error,
  onClose,
  onNewEntry,
  onEditEntry,
  onReverse,
  onCount,
  onRename,
}) {
  const [showLedger, setShowLedger] = useState(false);

  const params = { itemId: item._id, limit: 50 };
  const { data: ledger, loading } = useCachedQuery(
    showLedger ? cacheKey('stock-movements', params) : null,
    () => stockApi.listMovements(params)
  );

  const entries = ledger?.items ?? [];

  return (
    <Modal
      open
      onClose={onClose}
      error={error}
      title={item.name}
      description={`${category?.label ?? 'Material'} · counted in ${item.unit}`}
      footer={
        <>
          <button type="button" onClick={onCount} className={`${secondaryButton} sm:mr-auto`}>
            <FiSliders aria-hidden /> Count stock
          </button>
          {onRename ? (
            <button type="button" onClick={onRename} className={secondaryButton}>
              <FiEdit2 aria-hidden /> Rename
            </button>
          ) : null}
          <button
            type="button"
            onClick={onNewEntry}
            className="order-first inline-flex w-full items-center justify-center gap-2 rounded-xl
                       bg-brand-pink px-5 py-2 font-body text-sm font-semibold text-on-primary
                       transition-colors hover:bg-brand-pink-dark sm:order-none sm:w-auto"
          >
            <FiPlus aria-hidden /> New entry
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {note ? (
          <p
            role="status"
            className={`rounded-lg px-3 py-2.5 font-body text-sm font-semibold ${
              noteTone === 'warn' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {note}
          </p>
        ) : null}

        <div className="rounded-2xl bg-admin-cream p-4">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-brand-ink/50">
            In stock
          </p>
          <p
            className={`mt-1 font-body text-4xl font-bold ${
              item.balance < 0 ? 'text-rose-600' : 'text-brand-ink'
            }`}
          >
            {formatQuantity(item.balance)}{' '}
            <span className="text-base font-medium text-brand-ink/45">{item.unit}</span>
          </p>
          {item.needsCorrection ? (
            <p className="mt-2 font-body text-xs font-semibold text-rose-600">
              More went out than the ledger knew about — count this and set the figure with
              Count stock.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowLedger((open) => !open)}
            aria-expanded={showLedger}
            aria-controls="stock-item-ledger"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5
                       font-body text-sm font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                       transition-colors hover:bg-brand-ink/5"
          >
            {showLedger ? 'Hide ledger' : 'Show ledger'}
            <FiChevronDown
              aria-hidden
              className={`transition-transform ${showLedger ? 'rotate-180' : ''}`}
            />
          </button>

          {showLedger ? (
            <div id="stock-item-ledger">
              <h3 className="mt-2 font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
                Ledger
              </h3>

              {entries.length ? (
                <ul className="mt-1 flex flex-col">
                  {entries.map((m) => (
                    <MovementRow
                      key={m._id}
                      movement={m}
                      isOwner={isOwner}
                      onEdit={onEditEntry}
                      onReverse={onReverse}
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 font-body text-sm text-brand-ink/45">
                  {loading
                    ? 'Loading the ledger…'
                    : 'Nothing recorded yet. The stock figure above comes from these entries.'}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
