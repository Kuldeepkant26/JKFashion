import { Fragment, useEffect, useRef, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { TbNeedleThread } from 'react-icons/tb';
import * as inventoryApi from '../../../api/inventory.api.js';
import { useCachedQuery, cacheKey, invalidate } from '../../../api/useCachedQuery.js';
import { useAppStore } from '../../../store/useAppStore.js';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import SampleCard from './SampleCard.jsx';
import SampleForm from './SampleForm.jsx';
import SampleDetail from './SampleDetail.jsx';
import { MAIN_ADMIN, SAMPLE_FILTERS, inputClass } from './constants.js';

/**
 * Samples: filters, the card grid and the sample popup.
 *
 * Sampling is kept apart from production — a sample is judged by the buyer
 * before any quantity is committed. Once a sample is converted into an order
 * (Production → New order) it leaves this list: "All" shows only samples still
 * in sampling, and converted ones move under the "In production" pill.
 *
 * Used section-wide and inside one company's dashboard (`companyId`).
 *
 * @param focusId     a sample to open on arrival (linked from elsewhere)
 * @param onFocusDone called once that sample is open, so the link can be cleared
 * @param onOpenOrder called with an order id from a converted sample's popup
 */
export default function SamplesBoard({ companyId, focusId, onFocusDone, onOpenOrder }) {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  // "All" means everything still in sampling — see SAMPLE_FILTERS.
  const [status, setStatus] = useState('SAMPLING');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const [editing, setEditing] = useState(null); // null | 'new' | sample
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const flash = (message) => {
    setNote(message);
    setTimeout(() => setNote(''), 2500);
  };

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
    page,
    limit: 20,
  };

  const {
    data,
    error: loadError,
    loading,
  } = useCachedQuery(cacheKey('samples', params), () => inventoryApi.listSamples(params));

  const { data: companyList } = useCachedQuery(
    cacheKey('companies', { limit: 100 }),
    () => inventoryApi.listCompanies({ limit: 100 })
  );
  const companies = companyList?.items ?? [];

  /** Card copy first, full record (with its orders) when it arrives. */
  const openDetail = async (sample) => {
    setError('');
    setEditing(null);
    setSelected(sample);
    setDetailLoading(true);
    try {
      setSelected(await inventoryApi.getSample(sample._id));
    } catch (err) {
      setError(err?.message ?? 'Could not open that sample.');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const reloadDetail = async (id) => {
    try {
      setSelected(await inventoryApi.getSample(id));
    } catch {
      setSelected(null);
    }
  };

  /*
   * Open a linked sample when arriving with one to show — fetched first, as
   * there is no card copy. Then the link is cleared, so the same one can open
   * it again later.
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
      .getSample(focusId)
      .then((sample) => {
        if (cancelled) return;
        setError('');
        setEditing(null);
        setSelected(sample);
        onFocusDoneRef.current?.();
      })
      .catch((err) => !cancelled && setError(err?.message ?? 'Could not open that sample.'));

    return () => {
      cancelled = true;
    };
  }, [focusId]);

  const remove = async () => {
    const sample = confirming;
    setBusy(true);
    setError('');
    try {
      await inventoryApi.deleteSample(sample._id);
      invalidate('samples', 'summary', 'companies', 'company-overview');
      setSelected(null);
      setConfirming(null);
      flash('Sample deleted');
    } catch (err) {
      setError(err?.message ?? 'Could not delete that sample.');
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  };

  const items = data?.items ?? [];
  const counts = data?.statusCounts ?? {};
  const shownError = error || loadError?.message;
  const filtered = Boolean(debounced || status !== 'SAMPLING');

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search samples</span>
          <FiSearch
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/35"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={companyId ? 'Search by sample or design…' : 'Search by sample, design or buyer…'}
            className={`${inputClass} pl-10`}
          />
        </label>

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
          <FiPlus aria-hidden /> New sample
        </button>
      </div>

      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-1 rounded-2xl bg-brand-ink/[0.04] p-1">
          {SAMPLE_FILTERS.map((f) => (
            <Fragment key={f.value}>
              {/* "In production" is a different bucket from the statuses before
                  it — samples that have left sampling — so it sits apart. */}
              {f.apart ? (
                <span aria-hidden className="mx-1.5 my-2 w-px self-stretch bg-brand-ink/15" />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setStatus(f.value);
                  setPage(1);
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
                {counts[f.value] ? (
                  <span className="ml-1.5 rounded-full bg-brand-ink/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-ink/60">
                    {counts[f.value]}
                  </span>
                ) : null}
              </button>
            </Fragment>
          ))}
        </div>
      </div>

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

      {editing ? (
        <SampleForm
          open
          key={editing === 'new' ? 'new' : editing._id}
          initial={editing === 'new' ? null : editing}
          companies={companies}
          companyId={companyId}
          error={error}
          setError={setError}
          onCancel={() => setEditing(null)}
          onSaved={(message) => {
            const edited = editing !== 'new' ? editing._id : null;
            setEditing(null);
            if (edited) reloadDetail(edited);
            flash(message);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete this sample?"
        message={
          confirming
            ? `Sample ${confirming.sampleNumber} will be removed. This cannot be undone, and a sample that orders were raised from cannot be deleted.`
            : ''
        }
        confirmLabel="Delete sample"
        onConfirm={remove}
        onCancel={() => setConfirming(null)}
      />

      {selected ? (
        <SampleDetail
          sample={selected}
          loading={detailLoading}
          isOwner={isOwner}
          busy={busy}
          error={error}
          setError={setError}
          onClose={() => {
            setSelected(null);
            setError('');
          }}
          onEdit={(sample) => {
            setSelected(null);
            setEditing(sample);
          }}
          onDelete={setConfirming}
          onOpenOrder={
            onOpenOrder
              ? (order) => {
                  setSelected(null);
                  onOpenOrder(order._id);
                }
              : undefined
          }
          onChanged={(updated) => {
            setSelected(updated);
            invalidate('samples', 'summary', 'companies', 'company-overview');
          }}
        />
      ) : null}

      {loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Spinner label="Loading samples" />
        </div>
      ) : items.length ? (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((sample) => (
              <SampleCard
                key={sample._id}
                sample={sample}
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
          icon={TbNeedleThread}
          title={
            status === 'IN_PRODUCTION' && !debounced
              ? 'No samples in production yet'
              : filtered
                ? 'No samples match that view'
                : 'No samples in sampling'
          }
          hint={
            status === 'IN_PRODUCTION' && !debounced
              ? 'A sample moves here when it is converted into an order from Production → New order.'
              : filtered
                ? 'Try another filter or search.'
                : 'Record a sample when the buyer asks for one. When they confirm, convert it from Production → New order.'
          }
        />
      )}
    </div>
  );
}
