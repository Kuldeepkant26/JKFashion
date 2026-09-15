import { useCallback, useEffect, useState } from 'react';
import { FiBriefcase, FiPlus, FiSearch, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { useAppStore } from '../../../store/useAppStore.js';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';

/** Mirrors ROLES.MAIN_ADMIN on the API — the seeded owner. */
const MAIN_ADMIN = 'MAIN_ADMIN';

const inputClass =
  'w-full rounded-xl bg-surface-card px-3.5 py-2.5 font-body text-sm text-brand-ink ' +
  'ring-1 ring-brand-ink/12 transition-shadow placeholder:text-brand-ink/35 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-pink';

const FIELDS = [
  { name: 'name', label: 'Company name', placeholder: 'Meera Exports', required: true },
  { name: 'location', label: 'City', placeholder: 'Surat' },
  { name: 'gst', label: 'GST number', placeholder: '24AAAAA0000A1Z5' },
  { name: 'contact', label: 'Contact', placeholder: 'Ramesh Shah, 98765 43210' },
  { name: 'address', label: 'Address', placeholder: 'Street, area', full: true },
];

const EMPTY = { name: '', location: '', gst: '', contact: '', address: '' };

/** Create or edit. The same form either way — only the title and verb differ. */
function CompanyForm({ initial, onSaved, onCancel, setError }) {
  const [form, setForm] = useState(initial ?? EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?._id);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
      if (editing) await inventoryApi.updateCompany(initial._id, form);
      else await inventoryApi.createCompany(form);
      onSaved(editing ? 'Company saved' : 'Company added');
    } catch (err) {
      setError(err?.message ?? 'Could not save that company.');
      setFieldErrors(err.fieldErrors ?? {});
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-brand-ink">
          {editing ? 'Edit company' : 'New company'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="grid h-8 w-8 place-items-center rounded-full text-brand-ink/50
                     transition-colors hover:bg-brand-ink/5 hover:text-brand-ink"
        >
          <FiX />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label
            key={f.name}
            className={`flex flex-col gap-1.5 ${f.full ? 'sm:col-span-2' : ''}`}
          >
            <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink/60">
              {f.label}
              {f.required ? ' *' : ''}
            </span>
            <input
              type="text"
              required={f.required}
              placeholder={f.placeholder}
              value={form[f.name] ?? ''}
              onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
              className={`${inputClass} ${fieldErrors[f.name] ? 'ring-rose-300' : ''}`}
            />
            {fieldErrors[f.name] ? (
              <span className="text-xs text-rose-600">{fieldErrors[f.name]}</span>
            ) : null}
          </label>
        ))}
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-pink px-5 py-2.5 font-body text-sm font-semibold
                     text-on-primary transition-colors hover:bg-brand-pink-dark
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-brand-pink disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add company'}
        </button>
      </div>
    </form>
  );
}

function CompanyCard({ company, isOwner, busy, onEdit, onDelete }) {
  const initials = (company.name || '?').trim().slice(0, 2).toUpperCase();

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

      {company.gst || company.contact || company.address ? (
        <dl className="flex flex-col gap-1 border-t border-brand-ink/8 pt-3 font-body text-xs text-brand-ink/60">
          {company.contact ? (
            <div className="flex gap-2">
              <dt className="font-semibold">Contact</dt>
              <dd className="min-w-0 truncate">{company.contact}</dd>
            </div>
          ) : null}
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

      <div className="flex gap-2">
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

  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | company

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
      const result = await inventoryApi.listCompanies({
        search: debounced || undefined,
        page,
        limit: 20,
      });
      setData(result);
    } catch (err) {
      setError(err?.message ?? 'Could not load companies.');
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (company) => {
    if (
      !window.confirm(`Delete ${company.name}? This cannot be undone.`)
    ) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await inventoryApi.deleteCompany(company._id);
      await load();
      flash('Company deleted');
    } catch (err) {
      // A company with orders is refused by design — the message says so.
      setError(err?.message ?? 'Could not delete that company.');
    } finally {
      setBusy(false);
    }
  };

  const items = data?.items ?? [];

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

        {!editing ? (
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
        ) : null}
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
        <CompanyForm
          initial={editing === 'new' ? null : editing}
          setError={setError}
          onCancel={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            load();
            flash(message);
          }}
        />
      ) : null}

      {loading && !data ? (
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
                onDelete={remove}
              />
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
