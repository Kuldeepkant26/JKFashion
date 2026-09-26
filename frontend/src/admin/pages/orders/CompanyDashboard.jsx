import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiMail,
  FiUser,
  FiMapPin,
  FiClock,
} from 'react-icons/fi';
import * as inventoryApi from '../../../api/inventory.api.js';
import { useCachedQuery, cacheKey, invalidate } from '../../../api/useCachedQuery.js';
import { useAppStore } from '../../../store/useAppStore.js';
import { ROUTES } from '../../../constants/routePaths.js';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import CompanyForm from './CompanyForm.jsx';
import CompanyLogo from './CompanyLogo.jsx';
import SamplesBoard from './SamplesBoard.jsx';
import OrdersBoard from './OrdersBoard.jsx';
import { MAIN_ADMIN, formatDate, formatMetres } from './constants.js';

const TABS = [
  { value: 'history', label: 'History' },
  { value: 'samples', label: 'Sampling' },
  { value: 'orders', label: 'Production' },
];

/** How each history entry reads. */
const ACTIVITY = {
  SAMPLE_CREATED: { label: 'Sample started', dot: 'bg-violet-400' },
  SAMPLE_APPROVED: { label: 'Sample approved', dot: 'bg-emerald-500' },
  SAMPLE_REJECTED: { label: 'Sample rejected', dot: 'bg-brand-ink/30' },
  ORDER_CREATED: { label: 'Order confirmed', dot: 'bg-brand-pink' },
  PRODUCTION_LOGGED: { label: 'Production logged', dot: 'bg-amber-400' },
};

function Figure({ label, value, unit, tone = 'text-brand-ink' }) {
  return (
    <div className="rounded-2xl bg-surface-card px-4 py-3 shadow-sm ring-1 ring-black/5">
      <dt className="font-body text-xs text-brand-ink/50">{label}</dt>
      <dd className={`font-display text-xl font-bold ${tone}`}>
        {value}
        {unit ? <span className="ml-0.5 text-sm font-semibold">{unit}</span> : null}
      </dd>
    </div>
  );
}

/** One buyer's whole history, newest first. Each entry opens what it is about. */
function History({ items, onOpen }) {
  if (!items.length) {
    return (
      <EmptyState
        className="min-h-[30vh] bg-surface-card"
        icon={FiClock}
        title="Nothing recorded for this buyer yet"
        hint="Samples, orders and production logged against them will appear here as a timeline."
      />
    );
  }

  return (
    <ol className="flex flex-col rounded-2xl bg-surface-card p-2 shadow-sm ring-1 ring-black/5">
      {items.map((item, i) => {
        const look = ACTIVITY[item.kind] ?? {
          label: item.kind,
          dot: 'bg-brand-ink/30',
        };
        return (
          <li key={`${item.kind}-${item.ref.id}-${i}`}>
            <button
              type="button"
              onClick={() => onOpen(item.ref)}
              className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left
                         transition-colors hover:bg-brand-ink/[0.03]"
            >
              <span
                aria-hidden
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${look.dot}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-body text-sm text-brand-ink">
                  <b className="font-semibold">{look.label}</b> · {item.ref.number} · Design{' '}
                  {item.designNumber}
                </span>
                <span className="block font-body text-xs text-brand-ink/50">
                  {[
                    item.metres !== undefined
                      ? `${item.metres > 0 && item.kind === 'PRODUCTION_LOGGED' ? '+' : ''}${formatMetres(item.metres)}m`
                      : '',
                    item.note,
                    item.by,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              <span className="shrink-0 font-body text-xs text-brand-ink/45">
                {formatDate(item.date)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * One buyer's dashboard.
 *
 * Everything done for this company in one place — who they are, where their
 * work stands in figures, a history of it, and their samples and production
 * orders — so the section-wide lists never have to show every buyer's detail
 * at once.
 *
 * `?tab=` picks the sub-tab and `?open=` opens a sample or order in it, so a
 * history entry or a link from another screen lands on the record itself.
 */
export default function CompanyDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'history';
  const focusId = params.get('open') || undefined;

  const go = (nextTab, open) =>
    setParams(open ? { tab: nextTab, open } : { tab: nextTab }, {
      replace: false,
    });

  const {
    data,
    error: loadError,
    loading,
  } = useCachedQuery(cacheKey('company-overview', { id }), () =>
    inventoryApi.getCompanyOverview(id),
  );

  const remove = async () => {
    setError('');
    try {
      await inventoryApi.deleteCompany(id);
      invalidate('companies', 'summary');
      navigate(ROUTES.ADMIN_ORDERS_COMPANIES);
    } catch (err) {
      // A company with orders or samples is refused by design — the message says so.
      setError(err?.message ?? 'Could not delete that company.');
      setConfirming(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner label="Loading company" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          to={ROUTES.ADMIN_ORDERS_COMPANIES}
          className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-brand-ink/60 hover:text-brand-ink"
        >
          <FiArrowLeft aria-hidden /> All companies
        </Link>
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {loadError?.message ?? 'That company could not be loaded.'}
        </p>
      </div>
    );
  }

  const { company, stats, activity = [] } = data;
  const contacts = company.contacts ?? [];
  const { orders, metres, samples } = stats;
  const pct = metres.ordered > 0 ? Math.min(100, (metres.produced / metres.ordered) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <Link
        to={ROUTES.ADMIN_ORDERS_COMPANIES}
        className="inline-flex w-fit items-center gap-1.5 font-body text-sm font-semibold text-brand-ink/60 hover:text-brand-ink"
      >
        <FiArrowLeft aria-hidden /> All companies
      </Link>

      {editing ? (
        <CompanyForm
          open
          key={company._id}
          initial={company}
          error={error}
          setError={setError}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : null}

      <ConfirmDialog
        open={confirming}
        title="Delete this company?"
        message={`${company.name} will be removed. This cannot be undone, and a company that still has orders or samples cannot be deleted.`}
        confirmLabel="Delete company"
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />

      {/* ------------------------------------------------------- header */}
      <section className="flex flex-col gap-4 rounded-2xl bg-surface-card p-5 shadow-sm ring-1 ring-black/5">
        {/* Stacks on a phone, so the actions never squeeze the buyer's name. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <CompanyLogo company={company} size="lg" />

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold tracking-tight text-brand-ink">
                {company.name}
              </h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-brand-ink/55">
                {company.location ? (
                  <span className="inline-flex items-center gap-1">
                    <FiMapPin aria-hidden /> {company.location}
                  </span>
                ) : null}
                {company.gst ? <span>GST {company.gst}</span> : null}
                <span>Buyer since {formatDate(company.createdAt)}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-body text-xs
                         font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                         transition-colors hover:bg-brand-ink/5"
            >
              <FiEdit2 aria-hidden /> Edit
            </button>
            {isOwner ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-body text-xs
                           font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors
                           hover:bg-rose-50"
              >
                <FiTrash2 aria-hidden /> Delete
              </button>
            ) : null}
          </div>
        </div>

        {contacts.length || company.address ? (
          <div className="grid gap-3 border-t border-brand-ink/8 pt-4 font-body text-xs sm:grid-cols-2">
            {contacts.length ? (
              <ul className="flex flex-col gap-1.5">
                {contacts.map((c, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {c.name ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-brand-ink/75">
                        <FiUser aria-hidden size={12} className="text-brand-ink/35" /> {c.name}
                      </span>
                    ) : null}
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone}`}
                        className="inline-flex items-center gap-1.5 text-brand-ink/70 hover:underline"
                      >
                        <FiPhone aria-hidden size={12} className="text-brand-ink/35" /> {c.phone}
                      </a>
                    ) : null}
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="inline-flex items-center gap-1.5 text-brand-ink/70 hover:underline"
                      >
                        <FiMail aria-hidden size={12} className="text-brand-ink/35" /> {c.email}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {company.address ? <p className="text-brand-ink/60">{company.address}</p> : null}
          </div>
        ) : null}
      </section>

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {/* ------------------------------------------------------ figures */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure
          label="Samples in progress"
          value={samples.IN_PROGRESS ?? 0}
          tone="text-violet-700"
        />
        <Figure
          label="Ready for production"
          value={samples.APPROVED ?? 0}
          tone="text-emerald-600"
        />
        <Figure label="Orders active" value={orders.active} tone="text-sky-700" />
        <Figure
          label="Orders overdue"
          value={orders.overdue}
          tone={orders.overdue ? 'text-rose-600' : 'text-brand-ink'}
        />
      </dl>

      <div className="rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 font-body text-sm">
          <span className="text-brand-ink/60">
            <b className="text-brand-ink">{formatMetres(metres.ordered)}m</b> ordered −{' '}
            <b className="text-brand-ink">{formatMetres(metres.produced)}m</b> produced ={' '}
            <b className="text-brand-pink">{formatMetres(metres.remaining)}m remaining</b>
          </span>
          <span className="font-semibold text-brand-ink">{pct.toFixed(0)}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-brand-ink/8">
          <div className="h-full rounded-full bg-brand-pink" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 font-body text-xs text-brand-ink/45">
          Across {orders.total} order{orders.total === 1 ? '' : 's'} ({orders.completed} completed).
        </p>
      </div>

      {/* ----------------------------------------------------- sub-tabs */}
      <div className="-mx-1 overflow-x-auto pb-1">
        <div
          role="tablist"
          aria-label={`${company.name} sections`}
          className="flex min-w-max gap-1 rounded-2xl bg-brand-ink/[0.04] p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => go(t.value)}
              className={`rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition-colors
                          ${
                            tab === t.value
                              ? 'bg-surface-card text-brand-ink shadow-sm'
                              : 'text-brand-ink/55 hover:text-brand-ink'
                          }`}
            >
              {t.label}
              {/* Only what is still in sampling — converted samples have moved on. */}
              {t.value === 'samples' && samples.sampling ? (
                <span className="ml-1.5 rounded-full bg-brand-ink/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-ink/60">
                  {samples.sampling}
                </span>
              ) : null}
              {t.value === 'orders' && orders.total ? (
                <span className="ml-1.5 rounded-full bg-brand-ink/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-ink/60">
                  {orders.total}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {tab === 'history' ? (
        <History
          items={activity}
          onOpen={(ref) => go(ref.type === 'sample' ? 'samples' : 'orders', ref.id)}
        />
      ) : tab === 'samples' ? (
        <SamplesBoard
          companyId={company._id}
          focusId={focusId}
          onFocusDone={() => setParams({ tab }, { replace: true })}
          onOpenOrder={(orderId) => go('orders', orderId)}
        />
      ) : (
        <OrdersBoard
          companyId={company._id}
          focusId={focusId}
          onFocusDone={() => setParams({ tab }, { replace: true })}
          onOpenSample={(sampleId) => go('samples', sampleId)}
          onGoToSampling={() => go('samples')}
        />
      )}
    </div>
  );
}
