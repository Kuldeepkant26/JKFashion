import { useEffect, useRef, useState } from 'react';
import { FiClipboard, FiPlus, FiSearch, FiCalendar, FiX } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { useCachedQuery, cacheKey, invalidate } from '../../../api/useCachedQuery.js';
import { useAppStore } from '../../../store/useAppStore.js';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import OrderCard from './OrderCard.jsx';
import OrderForm from './OrderForm.jsx';
import NewOrderFlow from './NewOrderFlow.jsx';
import OrderDetail from './OrderDetail.jsx';
import { MAIN_ADMIN, FILTERS, DATE_PRESETS, inputClass } from './constants.js';

/**
 * Filter by when the order was raised.
 *
 * Presets for the questions that get asked ("what came in this month"), plus an
 * explicit range for the ones that do not. Choosing a preset fills the two date
 * inputs, and editing either of them drops back to "Custom" — so what is shown
 * always matches what is being sent.
 */
function DateRangeFilter({ range, onChange }) {
  const [open, setOpen] = useState(false);

  const active = DATE_PRESETS.find((p) => {
    const r = p.range();
    return r.from === range.from && r.to === range.to;
  });

  const label = active
    ? active.label
    : `${range.from || 'Any'} → ${range.to || 'today'}`;

  const applied = Boolean(range.from || range.to);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/50">
          <FiCalendar aria-hidden /> Raised
        </span>

        {DATE_PRESETS.map((preset) => {
          const r = preset.range();
          const isActive = r.from === range.from && r.to === range.to;

          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(r)}
              aria-pressed={isActive}
              className={`rounded-xl px-3 py-1.5 font-body text-xs font-semibold transition-colors
                          ${
                            isActive
                              ? 'bg-brand-pink text-on-primary'
                              : 'text-brand-ink/60 ring-1 ring-brand-ink/12 hover:bg-brand-ink/5'
                          }`}
            >
              {preset.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`rounded-xl px-3 py-1.5 font-body text-xs font-semibold transition-colors
                      ${
                        !active && applied
                          ? 'bg-brand-pink text-on-primary'
                          : 'text-brand-ink/60 ring-1 ring-brand-ink/12 hover:bg-brand-ink/5'
                      }`}
        >
          Custom range
        </button>

        {applied ? (
          <span className="inline-flex items-center gap-1.5 font-body text-xs text-brand-ink/50">
            {label}
            <button
              type="button"
              onClick={() => {
                onChange({ from: '', to: '' });
                setOpen(false);
              }}
              aria-label="Clear date filter"
              className="grid h-5 w-5 place-items-center rounded-full text-brand-ink/40
                         transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
            >
              <FiX size={12} />
            </button>
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl bg-admin-cream p-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
              From
            </span>
            <input
              type="date"
              value={range.from}
              max={range.to || undefined}
              onChange={(e) => onChange({ ...range, from: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
              To
            </span>
            <input
              type="date"
              value={range.to}
              min={range.from || undefined}
              onChange={(e) => onChange({ ...range, to: e.target.value })}
              className={inputClass}
            />
          </label>
          <p className="font-body text-xs text-brand-ink/50">
            Filters on the date an order was raised, not its deadline.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Production orders: filters, the card grid and the detail panel.
 *
 * Used twice — as the section-wide Production tab, and inside one company's
 * dashboard with `companyId` set, where the list, the pill counts and the
 * samples offered for a new order are all scoped to that buyer.
 *
 * "New order" offers two ways to start — convert a sample, or create an order
 * directly — and follows whichever is chosen (see NewOrderFlow).
 *
 * @param companyId      scope to one buyer
 * @param focusId        an order to open on arrival (linked from elsewhere)
 * @param onFocusDone    called once that order is open, so the link can be cleared
 * @param onOpenSample   called with a sample id when "From sample …" is clicked
 * @param onGoToSampling offered when there is no sample to convert
 * @param initialStatus  the filter to open on — a link from the dashboard
 * @param startNew       open the New order flow straight away
 */
export default function OrdersBoard({
  initialStatus = '',
  startNew = false,
  companyId,
  focusId,
  onFocusDone,
  onOpenSample,
  onGoToSampling,
}) {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  const [status, setStatus] = useState(initialStatus);
  const [range, setRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  /*
   * `creating` is the New order flow, whose own steps live in NewOrderFlow.
   * `editing` is the existing order whose form is open. The popup of an open
   * order is separate from both.
   */
  const [creating, setCreating] = useState(startNew);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const startNewOrder = () => {
    setSelected(null);
    setError('');
    setCreating(true);
  };

  const flash = (message) => {
    setNote(message);
    setTimeout(() => setNote(''), 2500);
  };

  /* One request per pause in typing, not one per keystroke. */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = {
    companyId: companyId || undefined,
    status: status || undefined,
    search: debounced || undefined,
    from: range.from || undefined,
    to: range.to || undefined,
    page,
    limit: 20,
  };

  const {
    data,
    error: loadError,
    loading,
  } = useCachedQuery(cacheKey('orders', params), () => inventoryApi.listOrders(params));

  /* The form needs the buyer list. Shares the `companies` cache prefix, so a
     company added on the other tab appears here without a reload. */
  const { data: companyList } = useCachedQuery(
    cacheKey('companies', { limit: 100 }),
    () => inventoryApi.listCompanies({ limit: 100 })
  );
  const companies = companyList?.items ?? [];

  /**
   * Open an order's detail panel.
   *
   * The card's own record is shown immediately and the full one — which the
   * list omits, because it excludes the production log — replaces it when it
   * arrives. `detailLoading` therefore means "fetching the log", not "nothing
   * to show": the panel always has an order to render while it is up.
   */
  const openDetail = async (order) => {
    setError('');
    setEditing(null);
    setSelected(order);
    setDetailLoading(true);
    try {
      const full = await inventoryApi.getOrder(order._id);
      setSelected(full);
    } catch (err) {
      setError(err?.message ?? 'Could not open that order.');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  /** Pull the open panel's order again, after something changed it. */
  const reloadDetail = async (id) => {
    try {
      setSelected(await inventoryApi.getOrder(id));
    } catch {
      // The order is gone, or unreadable — close rather than leave a panel
      // showing a record that no longer matches the list behind it.
      setSelected(null);
    }
  };

  /*
   * Open a linked order when arriving with one to show. Fetched before the
   * panel opens, because unlike a card click there is no list copy to show
   * while the full record loads.
   */
  /* The latest `onFocusDone`, so the effect below stays keyed on the id alone. */
  const onFocusDoneRef = useRef(onFocusDone);
  useEffect(() => {
    onFocusDoneRef.current = onFocusDone;
  });

  useEffect(() => {
    if (!focusId) return undefined;

    let cancelled = false;
    inventoryApi
      .getOrder(focusId)
      .then((order) => {
        if (cancelled) return;
        setError('');
        setEditing(null);
        setSelected(order);
        // Consumed: clearing the link lets the same one open it again later.
        onFocusDoneRef.current?.();
      })
      .catch((err) => !cancelled && setError(err?.message ?? 'Could not open that order.'));

    return () => {
      cancelled = true;
    };
  }, [focusId]);

  const remove = async () => {
    const order = confirming;
    setBusy(true);
    setError('');
    try {
      await inventoryApi.deleteOrder(order._id);
      invalidate('orders', 'summary', 'companies', 'samples', 'company-overview');
      setSelected(null);
      setConfirming(null);
      flash('Order deleted');
    } catch (err) {
      setError(err?.message ?? 'Could not delete that order.');
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  };

  const items = data?.items ?? [];
  const counts = data?.statusCounts ?? {};
  const shownError = error || loadError?.message;
  const filtered = Boolean(debounced || status || range.from || range.to);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search orders</span>
          <FiSearch
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/35"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              companyId ? 'Search by order, design, machine…' : 'Search by order, design, buyer, machine…'
            }
            className={`${inputClass} pl-10`}
          />
        </label>

        <button
          type="button"
          onClick={startNewOrder}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-pink px-5 py-2.5
                     font-body text-sm font-semibold text-on-primary transition-colors
                     hover:bg-brand-pink-dark focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
        >
          <FiPlus aria-hidden /> New order
        </button>
      </div>

      {/* Scrolls rather than wraps: a filter bar on two lines stops reading as
          one control. The counts are of the whole collection, not this page —
          so they do not move when a date range is applied. */}
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-1 rounded-2xl bg-brand-ink/[0.04] p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setStatus(f.value);
                setPage(1); // a new filter starts at its own first page
              }}
              aria-pressed={status === f.value}
              className={`rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition-colors
                          ${
                            status === f.value
                              ? 'bg-surface-card text-brand-ink shadow-sm'
                              : 'text-brand-ink/55 hover:text-brand-ink'
                          }`}
            >
              {f.label}
              {f.value && counts[f.value] ? (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    f.value === 'OVERDUE'
                      ? 'bg-rose-500 text-white'
                      : 'bg-brand-ink/10 text-brand-ink/60'
                  }`}
                >
                  {counts[f.value]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <DateRangeFilter
        range={range}
        onChange={(next) => {
          setRange(next);
          setPage(1);
        }}
      />

      {note ? (
        <p role="status" className="text-sm font-semibold text-emerald-600">
          {note}
        </p>
      ) : null}

      {shownError ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {shownError}
        </p>
      ) : null}

      {creating ? (
        <NewOrderFlow
          companyId={companyId}
          companies={companies}
          error={error}
          setError={setError}
          onClose={() => setCreating(false)}
          onCreated={(message) => {
            setCreating(false);
            flash(message);
          }}
          onGoToSampling={
            onGoToSampling
              ? () => {
                  setCreating(false);
                  onGoToSampling();
                }
              : undefined
          }
        />
      ) : null}

      {editing ? (
        <OrderForm
          open
          key={editing._id}
          initial={editing}
          companies={companies}
          companyId={companyId}
          error={error}
          setError={setError}
          onCancel={() => setEditing(null)}
          onSaved={(message) => {
            /*
             * Re-open the order's popup with its fresh values. Without this the
             * save appeared to do nothing: the popup had been closed to show
             * the form and never came back.
             */
            const edited = editing._id;
            setEditing(null);
            reloadDetail(edited);
            flash(message);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete this order?"
        message={
          confirming
            ? `Order ${confirming.orderNumber} and its production log will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete order"
        onConfirm={remove}
        onCancel={() => setConfirming(null)}
      />

      {/* `selected` alone gates this, not `detailLoading`: a delete clears the
          selection while a detail fetch may still be in flight, and gating on
          the flag too would leave a spinner up with no record behind it. */}
      {selected ? (
        <OrderDetail
          order={selected}
          loading={detailLoading}
          isOwner={isOwner}
          busy={busy}
          error={error}
          setError={setError}
          onClose={() => {
            setSelected(null);
            setError('');
          }}
          onEdit={(order) => {
            // The popup is closed while the form is up, and `editing` keeps
            // the order so `onSaved` can bring the popup back refreshed.
            setSelected(null);
            setEditing(order);
          }}
          onDelete={setConfirming}
          onOpenSample={
            onOpenSample
              ? (sampleId) => {
                  setSelected(null);
                  onOpenSample(sampleId);
                }
              : undefined
          }
          onChanged={(updated) => {
            setSelected(updated);
            // The card, the pill counts, the gauge and the sample all move with it.
            invalidate('orders', 'summary', 'samples', 'company-overview');
          }}
        />
      ) : null}

      {loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Spinner label="Loading orders" />
        </div>
      ) : items.length ? (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onOpen={openDetail}
                showCompany={!companyId}
              />
            ))}
          </ul>

          {data.pages > 1 ? (
            <div className="flex items-center justify-between gap-4">
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
        </>
      ) : (
        <EmptyState
          className="min-h-[40vh] bg-surface-card"
          icon={FiClipboard}
          title={filtered ? 'No orders match that view' : 'No production orders yet'}
          hint={
            filtered
              ? 'Try another filter, date range or search.'
              : 'Click New order to convert a sample the buyer has confirmed, or to create one directly.'
          }
        />
      )}
    </div>
  );
}
