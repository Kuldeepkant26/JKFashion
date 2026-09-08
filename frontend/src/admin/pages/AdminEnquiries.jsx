import { useCallback, useEffect, useState } from 'react';
import * as enquiryApi from '../../api/enquiry.api.js';
import { useAppStore } from '../../store/useAppStore.js';
import EmptyState from '../components/EmptyState.jsx';
import Spinner from '../components/Spinner.jsx';
import { FiInbox } from 'react-icons/fi';

const MAIN_ADMIN = 'MAIN_ADMIN';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'READ', label: 'Read' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STATUS_STYLES = {
  NEW: 'bg-brand-pink/12 text-brand-pink',
  READ: 'bg-brand-ink/8 text-brand-ink/60',
  ARCHIVED: 'bg-brand-ink/5 text-brand-ink/40',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** One enquiry, expandable. Collapsed it is a single scannable row. */
function EnquiryCard({ enquiry, isOwner, onStatus, onDelete, busy }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // Opening a NEW enquiry marks it read — the admin has now seen it, so
    // making them click a second button to say so is busywork.
    if (next && enquiry.status === 'NEW') onStatus(enquiry._id, 'READ');
  };

  return (
    <li
      className={`overflow-hidden rounded-2xl bg-surface-card ring-1 transition
                  ${enquiry.status === 'NEW' ? 'ring-brand-pink/40' : 'ring-black/5'}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors
                   hover:bg-brand-ink/[0.02] focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-body text-sm font-semibold text-brand-ink">
              {enquiry.name}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold
                          uppercase tracking-wider ${STATUS_STYLES[enquiry.status] ?? ''}`}
            >
              {enquiry.status}
            </span>
          </span>

          <span className="mt-0.5 block truncate font-body text-xs text-brand-ink/50">
            {enquiry.email}
            {enquiry.company ? ` · ${enquiry.company}` : ''}
          </span>

          {/* Collapsed preview, so the list is scannable without opening each. */}
          {!open ? (
            <span className="mt-1.5 block truncate font-body text-[13px] text-brand-ink/65">
              {enquiry.message}
            </span>
          ) : null}
        </span>

        <span className="shrink-0 text-right">
          <span className="block font-body text-[11px] text-brand-ink/40">
            {formatDate(enquiry.createdAt)}
          </span>
        </span>
      </button>

      {open ? (
        <div className="border-t border-black/5 px-4 py-4">
          <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-brand-ink/80">
            {enquiry.message}
          </p>

          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-body text-xs">
            <div>
              <dt className="text-brand-ink/40">Email</dt>
              <dd className="mt-0.5">
                <a
                  href={`mailto:${enquiry.email}`}
                  className="font-medium text-brand-pink hover:underline"
                >
                  {enquiry.email}
                </a>
              </dd>
            </div>

            {enquiry.phone ? (
              <div>
                <dt className="text-brand-ink/40">Phone</dt>
                <dd className="mt-0.5">
                  <a
                    href={`tel:${enquiry.phone.replace(/\s/g, '')}`}
                    className="font-medium text-brand-pink hover:underline"
                  >
                    {enquiry.phone}
                  </a>
                </dd>
              </div>
            ) : null}

            {enquiry.company ? (
              <div>
                <dt className="text-brand-ink/40">Company</dt>
                <dd className="mt-0.5 font-medium text-brand-ink/70">{enquiry.company}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`mailto:${enquiry.email}?subject=${encodeURIComponent(
                'Re: your enquiry — JK Fashion'
              )}`}
              className="rounded-xl bg-brand-pink px-4 py-2 font-body text-xs font-semibold
                         text-on-primary transition-colors hover:bg-brand-pink-dark"
            >
              Reply by email
            </a>

            {enquiry.status !== 'ARCHIVED' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus(enquiry._id, 'ARCHIVED')}
                className="rounded-xl px-4 py-2 font-body text-xs font-semibold text-brand-ink/65
                           ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                           disabled:opacity-60"
              >
                Archive
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus(enquiry._id, 'READ')}
                className="rounded-xl px-4 py-2 font-body text-xs font-semibold text-brand-ink/65
                           ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                           disabled:opacity-60"
              >
                Restore
              </button>
            )}

            {/* Destructive and irreversible, so it is owner-only — matching the
                API, which rejects a delete from anyone else. */}
            {isOwner ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(enquiry)}
                className="rounded-xl px-4 py-2 font-body text-xs font-semibold text-rose-600
                           ring-1 ring-rose-200 transition-colors hover:bg-rose-50
                           disabled:opacity-60"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

export default function AdminEnquiries() {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await enquiryApi.list({ status: status || undefined, page, limit: 20 });
      setData(result);
    } catch (err) {
      setError(err?.message ?? 'Could not load enquiries.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (id, next) => {
    setBusy(true);
    // Optimistic: the row should respond to the click, not to the round trip.
    setData((d) =>
      d
        ? {
            ...d,
            items: d.items.map((e) => (e._id === id ? { ...e, status: next } : e)),
            newCount: next !== 'NEW' ? Math.max(0, d.newCount - 1) : d.newCount,
          }
        : d
    );
    try {
      await enquiryApi.updateStatus(id, next);
    } catch (err) {
      setError(err?.message ?? 'Could not update that enquiry.');
      load(); // resync — the optimistic edit may now be wrong
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (enquiry) => {
    // Native confirm rather than a custom modal: it is one destructive action
    // on an admin-only screen, and a bespoke dialog would be more surface to
    // get wrong than the decision warrants.
    if (!window.confirm(`Delete the enquiry from ${enquiry.name}? This cannot be undone.`)) {
      return;
    }

    setBusy(true);
    try {
      await enquiryApi.remove(enquiry._id);
      await load();
    } catch (err) {
      setError(err?.message ?? 'Could not delete that enquiry.');
    } finally {
      setBusy(false);
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
            Enquiries
          </h1>
          <p className="mt-1 text-sm text-brand-ink/55">
            {data?.newCount
              ? `${data.newCount} new ${data.newCount === 1 ? 'enquiry' : 'enquiries'} waiting.`
              : 'Messages sent through the website’s enquiry form.'}
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-ink/70
                     ring-1 ring-brand-ink/12 transition-colors hover:bg-brand-ink/5
                     disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

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
              {f.value === 'NEW' && data?.newCount ? (
                <span className="ml-1.5 rounded-full bg-brand-pink px-1.5 py-0.5 text-[10px]
                                 font-bold text-on-primary">
                  {data.newCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Spinner label="Loading enquiries" />
        </div>
      ) : items.length ? (
        <>
          <ul className="flex flex-col gap-2.5">
            {items.map((enquiry) => (
              <EnquiryCard
                key={enquiry._id}
                enquiry={enquiry}
                isOwner={isOwner}
                onStatus={handleStatus}
                onDelete={handleDelete}
                busy={busy}
              />
            ))}
          </ul>

          {data.pages > 1 ? (
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-ink/70
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
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-ink/70
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
          icon={FiInbox}
          title={status ? `No ${status.toLowerCase()} enquiries` : 'No enquiries yet'}
          hint={
            status
              ? 'Try another filter.'
              : 'Messages sent through the website’s enquiry form will appear here.'
          }
        />
      )}
    </div>
  );
}
