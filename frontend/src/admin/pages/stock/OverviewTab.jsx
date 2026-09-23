import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiPackage, FiTrendingUp } from 'react-icons/fi';
import * as stockApi from '../../../api/stock.api.js';
import { useCachedQuery, cacheKey } from '../../../api/useCachedQuery.js';
import { ROUTES } from '../../../constants/routePaths.js';
import Spinner from '../../components/Spinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatQuantity, formatRupeesShort } from './constants.js';

/** One item's balance. Negative reads red — it is a discrepancy, not a figure. */
function BalanceTile({ item }) {
  const short = item.balance < 0;

  return (
    <div
      className={`rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ${
        short ? 'ring-rose-200' : 'ring-black/5'
      }`}
    >
      <p className="truncate font-body text-xs font-semibold uppercase tracking-wider text-brand-ink/50">
        {item.name}
      </p>
      <p
        className={`mt-1 font-body text-2xl font-bold ${
          short ? 'text-rose-600' : 'text-brand-ink'
        }`}
      >
        {formatQuantity(item.balance)}{' '}
        <span className="font-body text-xs font-medium text-brand-ink/45">{item.unit}</span>
      </p>
      {short ? (
        <p className="mt-1 font-body text-[11px] font-semibold text-rose-600">Needs a count</p>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = 'default' }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-black/5">
      <span
        aria-hidden
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          tone === 'warn' ? 'bg-rose-50 text-rose-600' : 'bg-brand-pink/12 text-brand-pink'
        }`}
      >
        <Icon />
      </span>
      <span className="min-w-0">
        <span className="block font-body text-xs uppercase tracking-wider text-brand-ink/50">
          {label}
        </span>
        <span className="block font-body text-lg font-bold text-brand-ink">{value}</span>
      </span>
    </div>
  );
}

export default function OverviewTab() {
  const { data, loading, error } = useCachedQuery(cacheKey('stock-summary'), () =>
    stockApi.getSummary()
  );

  const { data: itemData } = useCachedQuery(cacheKey('stock-items', {}), () =>
    stockApi.listItems()
  );

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner label="Loading stock" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
        {error.message}
      </p>
    );
  }

  const items = data?.items ?? [];
  const categories = itemData?.categories ?? [];
  const short = data?.needsCorrection ?? [];

  /* Group by category so the page reads the way the floor is organised. */
  const byCategory = categories
    .map((c) => ({ ...c, items: items.filter((i) => i.category === c.key) }))
    .filter((c) => c.items.length);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={FiTrendingUp}
          label="Expenses this month"
          value={formatRupeesShort(data?.expenseMonth ?? 0)}
        />
        <StatCard
          icon={FiPackage}
          label="Entries today"
          value={String(data?.todayMovements ?? 0)}
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Items needing a count"
          value={String(short.length)}
          tone={short.length ? 'warn' : 'default'}
        />
      </div>

      {/* A negative balance means the paperwork and the floor disagree. Naming
          the items is more useful than a count, since the fix is per item. */}
      {short.length ? (
        <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200">
          <p className="font-body text-sm font-semibold text-rose-800">
            {short.length} item{short.length === 1 ? '' : 's'} went below zero
          </p>
          <p className="mt-1 font-body text-xs text-rose-700">
            More was issued than the ledger knew about, so an opening figure is probably
            wrong. Count {short.length === 1 ? 'it' : 'them'} and set the correct stock:{' '}
            {short.map((i) => i.name).join(', ')}.
          </p>
          <Link
            to={ROUTES.ADMIN_INVENTORY_MATERIALS}
            className="mt-3 inline-flex rounded-xl bg-rose-600 px-4 py-2 font-body text-xs
                       font-semibold text-white transition-colors hover:bg-rose-700"
          >
            Go to Materials
          </Link>
        </div>
      ) : null}

      {byCategory.length ? (
        byCategory.map((category) => (
          <section key={category.key} className="flex flex-col gap-2">
            <h2 className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-brand-pink">
              {category.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {category.items.map((item) => (
                <BalanceTile key={item._id} item={item} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <EmptyState
          className="min-h-[40vh] bg-surface-card"
          icon={FiPackage}
          title="Nothing in stock yet"
          hint="Add your materials on the Materials tab, then record what comes in and goes out."
        />
      )}
    </div>
  );
}
