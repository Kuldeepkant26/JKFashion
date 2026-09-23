import { useCallback, useEffect, useState } from 'react';
import { FiClipboard, FiPlus, FiSearch } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { useAppStore } from '../../../store/useAppStore.js';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import OrderCard from './OrderCard.jsx';
import OrderForm from './OrderForm.jsx';
import OrderDetail from './OrderDetail.jsx';
import InventoryStats from './InventoryStats.jsx';
import { MAIN_ADMIN, FILTERS, inputClass } from './constants.js';

export default function OrdersTab() {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  /** null | 'new' | order — the form. Separate from the detail panel. */
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orders, stats] = await Promise.all([
        inventoryApi.listOrders({
          status: status || undefined,
          search: debounced || undefined,
          page,
          limit: 20,
        }),
        inventoryApi.getSummary(),
      ]);
      setData(orders);
      setSummary(stats);
    } catch (err) {
      setError(err?.message ?? 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [status, debounced, page]);

  useEffect(() => {
    load();
  }, [load]);

  /* The form needs the buyer list; fetched once rather than per open. */
  useEffect(() => {
    let cancelled = false;
    inventoryApi
      .listCompanies({ limit: 100 })
      .then((result) => {
        if (!cancelled) setCompanies(result.items);
      })
      .catch(() => {
        // The form shows an empty picker and says so; not worth a banner here.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openDetail = async (order) => {
    setEditing(null);
    setSelected(order);
    setDetailLoading(true);
    try {
      // The list omits the log, so the detail view fetches the full record.
      setSelected(await inventoryApi.getOrder(order._id));
    } catch (err) {
      setError(err?.message ?? 'Could not open that order.');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const remove = async (order) => {
    if (
      !window.confirm(
        `Delete order ${order.orderNumber}? Its production log goes with it, and this ` +
          `cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await inventoryApi.deleteOrder(order._id);
      setSelected(null);
      await load();
      flash('Order deleted');
    } catch (err) {
      setError(err?.message ?? 'Could not delete that order.');
    } finally {
      setBusy(false);
    }
  };

  const items = data?.items ?? [];
  const counts = data?.statusCounts ?? {};

  return (
    <div className="flex flex-col gap-5">
      <InventoryStats summary={summary} />

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
            placeholder="Search by order, design, buyer, machine…"
            className={`${inputClass} pl-10`}
          />
        </label>

        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setEditing('new');
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-pink px-5 py-2.5
                       font-body text-sm font-semibold text-on-primary transition-colors
                       hover:bg-brand-pink-dark focus-visible:outline-2
                       focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
          >
            <FiPlus aria-hidden /> New order
          </button>
        ) : null}
      </div>

      {/* Scrolls rather than wraps: a filter bar on two lines stops reading as
          one control. The counts are of the whole collection, not this page. */}
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

      {editing ? (
        <OrderForm
          initial={editing === 'new' ? null : editing}
          companies={companies}
          setError={setError}
          onCancel={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            load();
            flash(message);
          }}
        />
      ) : null}

      {selected || detailLoading ? (
        <OrderDetail
          order={selected}
          loading={detailLoading}
          isOwner={isOwner}
          busy={busy}
          setError={setError}
          onClose={() => setSelected(null)}
          onEdit={(order) => {
            setSelected(null);
            setEditing(order);
          }}
          onDelete={remove}
          onChanged={(updated) => {
            setSelected(updated);
            // The card, the pill counts and the gauge all move with it.
            load();
          }}
        />
      ) : null}

      {loading && !data ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Spinner label="Loading orders" />
        </div>
      ) : items.length ? (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((order) => (
              <OrderCard key={order._id} order={order} onOpen={openDetail} />
            ))}
          </ul>

          {data.pages > 1 ? (
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
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
                disabled={page >= data.pages || loading}
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
          title={
            debounced || status ? 'No orders match that view' : 'No production orders yet'
          }
          hint={
            debounced || status
              ? 'Try another filter or search.'
              : 'Raise an order against one of your buyers to start tracking it.'
          }
        />
      )}
    </div>
  );
}
