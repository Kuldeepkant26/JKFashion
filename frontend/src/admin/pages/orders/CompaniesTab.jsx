import { useEffect, useState } from 'react';
import {
  FiBriefcase,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiMail,
  FiUser,
} from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { useCachedQuery, cacheKey, invalidate } from '../../../api/useCachedQuery.js';
import { useAppStore } from '../../../store/useAppStore.js';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import CompanyForm from './CompanyForm.jsx';
import { MAIN_ADMIN, inputClass } from './constants.js';

/** One contact row on a card. Only the fields that were filled in show. */
function ContactLine({ contact }) {
  const bits = [
    { icon: FiUser, value: contact.name },
    { icon: FiPhone, value: contact.phone, href: `tel:${contact.phone}` },
    { icon: FiMail, value: contact.email, href: `mailto:${contact.email}` },
  ].filter((b) => b.value);

  if (!bits.length) return null;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {bits.map(({ icon: Icon, value, href }) => (
        <span key={value} className="inline-flex min-w-0 items-center gap-1.5">
          <Icon aria-hidden size={12} className="shrink-0 text-brand-ink/35" />
          {href ? (
            // A number on a card is there to be rung; on a phone this dials.
            <a
              href={href}
              className="min-w-0 truncate text-brand-ink/70 underline-offset-2 hover:underline"
            >
              {value}
            </a>
          ) : (
            <span className="min-w-0 truncate font-semibold text-brand-ink/75">{value}</span>
          )}
        </span>
      ))}
    </li>
  );
}

function CompanyCard({ company, isOwner, busy, onEdit, onDelete }) {
  const initials = (company.name || '?').trim().slice(0, 2).toUpperCase();
  const contacts = company.contacts ?? [];

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-pink/12
                     font-display text-sm font-bold text-brand-pink"
        >
          {initials}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-body text-sm font-semibold text-brand-ink">
            {company.name}
          </span>
          <span className="mt-0.5 block font-body text-xs text-brand-ink/50">
            {company.location || 'No city set'}
          </span>
        </span>

        <span
          className="shrink-0 rounded-full bg-brand-ink/8 px-2 py-0.5 font-body text-[10px]
                     font-semibold uppercase tracking-wider text-brand-ink/60"
        >
          {company.orderCount} order{company.orderCount === 1 ? '' : 's'}
        </span>
      </div>

      {contacts.length ? (
        <ul className="flex flex-col gap-1.5 border-t border-brand-ink/8 pt-3 font-body text-xs">
          {contacts.map((contact, i) => (
            <ContactLine key={i} contact={contact} />
          ))}
        </ul>
      ) : null}

      {company.gst || company.address ? (
        <dl
          className={`flex flex-col gap-1 font-body text-xs text-brand-ink/60 ${
            contacts.length ? '' : 'border-t border-brand-ink/8 pt-3'
          }`}
        >
          {company.gst ? (
            <div className="flex gap-2">
              <dt className="font-semibold">GST</dt>
              <dd>{company.gst}</dd>
            </div>
          ) : null}
          {company.address ? (
            <div className="flex gap-2">
              <dt className="font-semibold">Address</dt>
              <dd className="min-w-0">{company.address}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-auto flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onEdit(company)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-body text-xs
                     font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                     transition-colors hover:bg-brand-ink/5 disabled:opacity-60"
        >
          <FiEdit2 aria-hidden /> Edit
        </button>

        {/* Destructive and irreversible, so it is owner-only — matching the
            API, which rejects a delete from anyone else. */}
        {isOwner ? (
          <button
            type="button"
            onClick={() => onDelete(company)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-body text-xs
                       font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors
                       hover:bg-rose-50 disabled:opacity-60"
          >
            <FiTrash2 aria-hidden /> Delete
          </button>
        ) : null}
      </div>
    </li>
  );
}

export default function CompaniesTab() {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | company
  const [confirming, setConfirming] = useState(null);

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

  /*
   * Cached by filter, so paging back or switching tabs re-renders instantly and
   * refreshes behind what is already on screen.
   */
  const params = { search: debounced || undefined, page, limit: 20 };
  const {
    data,
    error: loadError,
    loading,
  } = useCachedQuery(cacheKey('companies', params), () => inventoryApi.listCompanies(params));

  const remove = async () => {
    const company = confirming;
    setBusy(true);
    setError('');
    try {
      await inventoryApi.deleteCompany(company._id);
      invalidate('companies', 'summary');
      setConfirming(null);
      flash('Company deleted');
    } catch (err) {
      // A company with orders is refused by design — the message says so.
      setError(err?.message ?? 'Could not delete that company.');
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  };

  const items = data?.items ?? [];
  const shownError = error || loadError?.message;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search companies</span>
          <FiSearch
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-ink/35"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city or contact…"
            className={`${inputClass} pl-10`}
          />
        </label>

        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-pink px-5 py-2.5
                     font-body text-sm font-semibold text-on-primary transition-colors
                     hover:bg-brand-pink-dark focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
        >
          <FiPlus aria-hidden /> Add company
        </button>
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
        <CompanyForm
          open
          /* Keyed so switching straight from one company to another rebuilds
             the form state instead of keeping the previous buyer's values. */
          key={editing === 'new' ? 'new' : editing._id}
          initial={editing === 'new' ? null : editing}
          setError={setError}
          onCancel={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            flash(message);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete this company?"
        message={
          confirming
            ? `${confirming.name} will be removed. This cannot be undone, and a company that still has orders against it cannot be deleted.`
            : ''
        }
        confirmLabel="Delete company"
        onConfirm={remove}
        onCancel={() => setConfirming(null)}
      />

      {loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Spinner label="Loading companies" />
        </div>
      ) : items.length ? (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((company) => (
              <CompanyCard
                key={company._id}
                company={company}
                isOwner={isOwner}
                busy={busy}
                onEdit={setEditing}
                onDelete={setConfirming}
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
          icon={FiBriefcase}
          title={debounced ? 'No companies match that search' : 'No companies yet'}
          hint={
            debounced
              ? 'Try a different name or city.'
              : 'Add the buyers you produce for, then orders can be raised against them.'
          }
        />
      )}
    </div>
  );
}
