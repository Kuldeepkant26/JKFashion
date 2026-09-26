import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBriefcase, FiPlus, FiSearch, FiChevronRight } from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { useCachedQuery, cacheKey } from '../../../api/useCachedQuery.js';
import { companyPath } from '../../../constants/routePaths.js';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import CompanyForm from './CompanyForm.jsx';
import CompanyLogo from './CompanyLogo.jsx';
import { inputClass } from './constants.js';

/** A small count with its label, dimmed when there is nothing to report. */
function Count({ value, label, tone = 'text-brand-ink' }) {
  return (
    <span className="flex flex-col items-end leading-tight">
      <span className={`font-display text-base font-bold ${value ? tone : 'text-brand-ink/30'}`}>
        {value}
      </span>
      <span className="font-body text-[10px] uppercase tracking-wider text-brand-ink/45">
        {label}
      </span>
    </span>
  );
}

/**
 * One buyer, as a row. The whole row opens the buyer's dashboard, where
 * their contacts, samples, orders and history live — the list only says who
 * they are and whether there is work on the go.
 */
function CompanyRow({ company }) {
  return (
    <li>
      <Link
        to={companyPath(company._id)}
        className="flex items-center gap-3 rounded-2xl bg-surface-card px-4 py-3 shadow-sm
                   ring-1 ring-black/5 transition hover:ring-brand-pink/40
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-brand-pink"
      >
        <CompanyLogo company={company} />

        <span className="min-w-0 flex-1">
          <span className="block truncate font-body text-sm font-semibold text-brand-ink">
            {company.name}
          </span>
          <span className="mt-0.5 block truncate font-body text-xs text-brand-ink/50">
            {company.location || 'No city set'}
          </span>
        </span>

        <span className="hidden items-center gap-5 sm:flex">
          <Count value={company.openSamples ?? 0} label="Samples open" tone="text-violet-700" />
          <Count value={company.activeOrders ?? 0} label="Orders active" tone="text-sky-700" />
          <Count value={company.orderCount ?? 0} label="Orders total" />
        </span>

        {/* On a phone the three counts collapse to the one that matters most. */}
        <span className="font-body text-xs text-brand-ink/50 sm:hidden">
          {company.activeOrders ?? 0} active
        </span>

        <FiChevronRight aria-hidden className="shrink-0 text-brand-ink/30" />
      </Link>
    </li>
  );
}

export default function CompaniesTab() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  /* One request per pause in typing, not one per keystroke. */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = { search: debounced || undefined, page, limit: 20 };
  const {
    data,
    error: loadError,
    loading,
  } = useCachedQuery(cacheKey('companies', params), () => inventoryApi.listCompanies(params));

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
          onClick={() => setAdding(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-pink px-5 py-2.5
                     font-body text-sm font-semibold text-on-primary transition-colors
                     hover:bg-brand-pink-dark focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-brand-pink"
        >
          <FiPlus aria-hidden /> Add company
        </button>
      </div>

      {shownError ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {shownError}
        </p>
      ) : null}

      {adding ? (
        <CompanyForm
          open
          initial={null}
          error={error}
          setError={setError}
          onCancel={() => setAdding(false)}
          onSaved={(_message, company) => {
            setAdding(false);
            // Straight into the new buyer's dashboard, where work is raised.
            if (company?._id) navigate(companyPath(company._id));
          }}
        />
      ) : null}

      {loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Spinner label="Loading companies" />
        </div>
      ) : items.length ? (
        <>
          <ul className="flex flex-col gap-2">
            {items.map((company) => (
              <CompanyRow key={company._id} company={company} />
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
              : 'Add the buyers you produce for. Each gets a dashboard of its samples, orders and history.'
          }
        />
      )}
    </div>
  );
}
