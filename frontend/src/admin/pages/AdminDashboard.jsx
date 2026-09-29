import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiAlertTriangle,
  FiInbox,
  FiClock,
  FiCheckCircle,
  FiArrowUpRight,
  FiTrendingUp,
} from 'react-icons/fi';
import * as adminApi from '../../api/admin.api.js';
import { useCachedQuery, cacheKey } from '../../api/useCachedQuery.js';
import { useAppStore } from '../../store/useAppStore.js';
import { hasPermission } from '../../constants/permissions.js';
import { ROUTES, companyPath } from '../../constants/routePaths.js';
import { useResolvedPalette } from '../../theme/useResolvedPalette.js';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import KpiCard from './dashboard/KpiCard.jsx';
import {
  Card,
  CardLink,
  SectionHeading,
  BarList,
  NumbersTable,
  RangeControl,
  Delta,
} from './dashboard/parts.jsx';
import {
  ProductionChart,
  ExpensesChart,
  EnquiriesChart,
  CompletionGauge,
} from './dashboard/charts.jsx';
import * as fmt from './dashboard/format.js';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

const CATEGORY_LABELS = {
  BOBBIN: 'Bobbin',
  BORER: 'Borer',
  YARN: 'Yarn',
  FABRIC: 'Fabric',
  NEEDLE: 'Needle',
  OTHER: 'Other items',
};

/** A figure beside the production chart, scoped by the same period. */
function PeriodStat({ label, value, sub, delta, className = '' }) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1 rounded-3xl bg-surface-card p-4 shadow-sm ring-1 ring-black/5 sm:p-5 ${className}`}
    >
      <span className="font-body text-sm font-medium text-brand-ink/60">{label}</span>
      <span className="font-body text-2xl font-bold tracking-tight text-brand-ink normal-nums">
        {value}
      </span>
      {delta ? <Delta {...delta} /> : null}
      {sub ? <span className="font-body text-xs text-brand-ink/50">{sub}</span> : null}
    </div>
  );
}

/** A line that needs acting on: icon, words, and where to act. */
function AlertLink({ to, children }) {
  const body = (
    <>
      <FiAlertTriangle aria-hidden className="shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
      {to ? <FiArrowUpRight aria-hidden className="shrink-0" /> : null}
    </>
  );
  const shape =
    'flex items-center gap-2 rounded-2xl bg-critical-soft px-3 py-2.5 font-body text-sm font-semibold text-critical';
  return to ? (
    <Link to={to} className={`${shape} transition-colors hover:bg-critical-soft-hover`}>
      {body}
    </Link>
  ) : (
    <p className={shape}>{body}</p>
  );
}

/**
 * The hero's breakdown of what "active" is made of. Divided by hairlines in
 * the label colour rather than set on tinted chips, so the text keeps the
 * contrast --on-primary was validated for.
 */
function ActiveBreakdown({ pipeline }) {
  return (
    <span className="grid grid-cols-3 divide-x divide-on-primary/30 border-y border-on-primary/30 py-2">
      {[
        ['RUNNING', 'Running'],
        ['PENDING', 'Pending'],
        ['PAUSED', 'Paused'],
      ].map(([key, label]) => (
        <span key={key} className="flex flex-col px-2 first:pl-0 last:pr-0">
          <span className="font-body text-lg font-bold leading-tight text-on-primary normal-nums">
            {fmt.count(pipeline[key] ?? 0)}
          </span>
          <span className="font-body text-[11px] font-medium text-on-primary">{label}</span>
        </span>
      ))}
    </span>
  );
}

const dueLabel = (deadline) => {
  const d = fmt.daysUntil(deadline);
  if (d < 0) return `${-d} day${d === -1 ? '' : 's'} late`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `In ${d} days`;
};

/** Orders due soon, the late ones first. Each opens the order. */
function DueList({ orders, palette, orderLink }) {
  if (!orders.length) {
    return (
      <p className="flex items-center gap-2 font-body text-sm text-brand-ink/55">
        <FiCheckCircle aria-hidden className="text-good" /> Nothing late or due in the next 7 days.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {orders.map((o) => {
        const pct = o.orderedMetres > 0 ? Math.min(100, (o.completedMetres / o.orderedMetres) * 100) : 0;
        const body = (
          <>
            <span
              aria-hidden
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                o.isOverdue ? 'bg-critical-soft text-critical' : 'bg-brand-pink/10 text-brand-pink'
              }`}
            >
              {o.isOverdue ? <FiAlertTriangle /> : <FiClock />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate font-body text-sm font-semibold text-brand-ink">
                  {o.orderNumber}
                </span>
                <span
                  className={`shrink-0 font-body text-xs font-semibold ${
                    o.isOverdue ? 'text-critical' : 'text-brand-ink/60'
                  }`}
                >
                  {dueLabel(o.deadline)}
                </span>
              </span>
              <span className="block truncate font-body text-xs text-brand-ink/55">
                {o.companyName} · Design {o.designNumber}
              </span>
              <span className="mt-1.5 flex items-center gap-2.5">
                <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-brand-ink/6">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${pct}%`, background: palette.primary }}
                  />
                </span>
                <span className="shrink-0 font-body text-[11px] text-brand-ink/55 tabular-nums">
                  {fmt.metres(o.completedMetres)} / {fmt.metres(o.orderedMetres)}
                </span>
              </span>
            </span>
          </>
        );
        const shape = 'flex items-center gap-3 rounded-2xl p-2 sm:p-2.5';

        return (
          <li key={o._id}>
            {orderLink ? (
              <Link
                to={`${orderLink}?open=${o._id}`}
                className={`${shape} transition-colors hover:bg-brand-ink/4`}
              >
                {body}
              </Link>
            ) : (
              <div className={shape}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The panel's landing page: how the business stands, in one screen.
 *
 * Every number is live and every headline opens the section it came from.
 * Figures from a section the viewer cannot open are still shown — the
 * dashboard is the overview — but are not links; money and stock come only
 * for an account with that section, and the API leaves them out otherwise.
 */
export default function AdminDashboard() {
  const user = useAppStore((s) => s.user);
  const palette = useResolvedPalette();
  const [range, setRange] = useState(30);

  const { data, error } = useCachedQuery(cacheKey('dashboard', { range }), () =>
    adminApi.dashboard(range)
  );

  /*
   * While another period loads, keep the last one on screen, faded, rather
   * than flashing a spinner — the layout holds still and the numbers settle.
   */
  const [held, setHeld] = useState(null);
  useEffect(() => {
    if (data) setHeld(data);
  }, [data]);
  const shown = data ?? held;
  const refreshing = !data && Boolean(held);

  if (error && !shown) {
    return (
      <p role="alert" className="rounded-xl bg-critical-soft px-4 py-3 font-body text-sm text-critical">
        {error.message}
      </p>
    );
  }

  if (!shown) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner label="Loading dashboard" />
      </div>
    );
  }

  const canOrders = hasPermission(user, 'INVENTORY');
  const canStock = hasPermission(user, 'STOCK');
  const canEnquiries = hasPermission(user, 'ENQUIRIES');
  const allowed = (ok, to) => (ok ? to : undefined);

  const { orders, samples, enquiries, stock } = shown;
  const production = orders.production;
  const list = ROUTES.ADMIN_ORDERS_LIST;
  const sampling = ROUTES.ADMIN_ORDERS_SAMPLES;
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div data-surface="data" className="flex flex-col gap-8">
      {/* ------------------------------------------------------ header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-body text-sm text-brand-ink/50">{todayLabel}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
            {fmt.greeting()}, {firstName}
          </h1>
          <p className="mt-1 font-body text-sm text-brand-ink/55">
            How the floor, sampling and orders stand right now.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canOrders ? (
            <>
              <Link
                to={`${list}?new=1`}
                className="inline-flex items-center gap-2 rounded-full bg-brand-pink px-5 py-2.5 font-body
                           text-sm font-semibold text-on-primary shadow-sm transition-colors
                           hover:bg-brand-pink-dark"
              >
                <FiPlus aria-hidden /> New order
              </Link>
              <Link
                to={`${sampling}?new=1`}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-body text-sm
                           font-semibold text-brand-ink/75 ring-1 ring-brand-ink/15 transition-colors
                           hover:bg-brand-ink/5"
              >
                <FiPlus aria-hidden /> New sample
              </Link>
            </>
          ) : null}
          {canStock ? (
            <Link
              to={ROUTES.ADMIN_INVENTORY_MATERIALS}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-body text-sm
                         font-semibold text-brand-ink/75 ring-1 ring-brand-ink/15 transition-colors
                         hover:bg-brand-ink/5"
            >
              <FiPlus aria-hidden /> Stock entry
            </Link>
          ) : null}
        </div>
      </header>

      {/* ------------------------------------------------ headline figures */}
      <section aria-label="Headline figures" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {/*
          * Six tiles with money, five without. The spans keep every row full:
          * with six, the last tile takes a whole row on phones (hero + 5
          * leaves one over); with five, the hero is two columns wide on
          * larger screens so 2 + 4 fills the grid.
          */}
        <KpiCard
          hero
          className={stock ? 'col-span-2 lg:col-span-1' : 'col-span-2'}
          to={allowed(canOrders, list)}
          label="Active orders"
          value={fmt.count(orders.active.count)}
          sub={`${fmt.metres(orders.active.remainingMetres)} still to make`}
          palette={palette}
        >
          <ActiveBreakdown pipeline={orders.pipeline} />
        </KpiCard>
        <KpiCard
          to={allowed(canOrders, list)}
          label="Produced today"
          value={fmt.metres(orders.today.metres)}
          delta={{
            value: fmt.percentChange(orders.today.metres, orders.today.yesterday),
            versus: 'vs yesterday',
          }}
          trend={orders.today.trend}
          palette={palette}
        />
        <KpiCard
          to={allowed(canOrders, `${list}?status=OVERDUE`)}
          label="Overdue orders"
          value={fmt.count(orders.overdue)}
          alert={orders.overdue ? 'Past their deadline' : null}
          sub={orders.overdue ? null : 'Everything is on time'}
          palette={palette}
        />
        <KpiCard
          to={allowed(canOrders, sampling)}
          label="Samples open"
          value={fmt.count(samples.open)}
          alert={samples.overdue ? `${samples.overdue} overdue` : null}
          sub={
            samples.delivered
              ? `${fmt.count(samples.delivered)} with the buyer · ${fmt.count(samples.ready)} ready`
              : `${fmt.count(samples.ready)} ready for production`
          }
          palette={palette}
        />
        <KpiCard
          to={allowed(canEnquiries, ROUTES.ADMIN_ENQUIRIES)}
          label="New enquiries"
          value={fmt.count(enquiries.new)}
          sub={`${fmt.count(enquiries.thisWeek)} this week`}
          trend={enquiries.weeks.map((w) => w.count)}
          palette={palette}
        />
        {stock ? (
          <KpiCard
            className="col-span-2 lg:col-span-1"
            to={allowed(canStock, ROUTES.ADMIN_INVENTORY_EXPENSES)}
            label="Expenses this month"
            value={fmt.rupees(stock.expenses.thisMonth)}
            delta={{
              value: fmt.percentChange(stock.expenses.thisMonth, stock.expenses.lastMonth),
              versus: 'vs last month',
              upIsGood: false,
            }}
            trend={stock.expenses.months.map((m) => m.paise)}
            palette={palette}
          />
        ) : null}
      </section>

      {/* ------------------------------------------------------ production */}
      <section className="flex flex-col gap-4">
        <SectionHeading title="Production">
          <RangeControl value={range} options={RANGES} onChange={setRange} label="Period" />
        </SectionHeading>

        <div className={`grid gap-4 transition-opacity lg:grid-cols-3 ${refreshing ? 'opacity-60' : ''}`}>
          <Card
            className="lg:col-span-2"
            title="Metres produced per day"
            subtitle={`Last ${production.range} days`}
            action={<CardLink to={allowed(canOrders, list)} />}
          >
            {production.total ? (
              <ProductionChart days={production.days} palette={palette} />
            ) : (
              <EmptyState
                className="min-h-64"
                icon={FiTrendingUp}
                title="Nothing logged in this period"
                hint="Production logged against orders appears here, day by day."
              />
            )}
            <NumbersTable
              caption="Metres produced per day"
              columns={['Day', 'Metres']}
              rows={[...production.days].reverse().map((d) => [fmt.shortDate(d.date), fmt.metres(d.metres)])}
            />
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-1">
            <PeriodStat
              className="col-span-2 sm:col-span-1"
              label={`Produced in ${production.range} days`}
              value={fmt.metres(production.total)}
              delta={{
                value: fmt.percentChange(production.total, production.previousTotal),
                versus: `vs the ${production.range} days before`,
              }}
            />
            <PeriodStat label="Daily average" value={fmt.metres(production.dailyAverage)} sub="Including days off" />
            <PeriodStat
              label="Best day"
              value={production.bestDay ? fmt.metres(production.bestDay.metres) : '—'}
              sub={production.bestDay ? fmt.shortDate(production.bestDay.date) : 'Nothing logged yet'}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ where work stands */}
      <section className="flex flex-col gap-4">
        <SectionHeading title="Where work stands" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card title="Overall completion" subtitle="Everything on order and not yet completed">
            <CompletionGauge
              pct={orders.completion.pct}
              produced={orders.completion.produced}
              ordered={orders.completion.ordered}
              palette={palette}
            />
          </Card>

          <Card
            title="Orders by status"
            subtitle={`${fmt.count(orders.active.count)} open · ${fmt.count(orders.pipeline.COMPLETED)} completed`}
            action={<CardLink to={allowed(canOrders, list)} />}
          >
            <BarList
              color={palette.primary}
              formatValue={fmt.count}
              emptyText="No orders yet."
              rows={[
                ['PENDING', 'Pending', 'not started'],
                ['RUNNING', 'Running', 'on the machines'],
                ['PAUSED', 'Paused', 'on hold'],
                ['COMPLETED', 'Completed', null],
              ].map(([key, label, note]) => ({
                key,
                label,
                note,
                value: orders.pipeline[key] ?? 0,
                to: allowed(canOrders, `${list}?status=${key}`),
              }))}
            />
            {orders.overdue ? (
              <AlertLink to={allowed(canOrders, `${list}?status=OVERDUE`)}>
                {fmt.count(orders.overdue)} order{orders.overdue === 1 ? ' is' : 's are'} past the
                deadline
              </AlertLink>
            ) : null}
          </Card>

          <Card
            className="md:col-span-2 xl:col-span-1"
            title="Sampling"
            subtitle="Where each sample is"
            action={<CardLink to={allowed(canOrders, sampling)} />}
          >
            <BarList
              color={palette.primary}
              formatValue={fmt.count}
              emptyText="No samples yet."
              rows={[
                ['IN_PROGRESS', 'In progress', null],
                ['DELIVERED', 'Delivered', 'with the buyer'],
                ['APPROVED', 'Approved', 'ready for production'],
                ['IN_PRODUCTION', 'In production', null],
                ['REJECTED', 'Rejected', null],
              ].map(([key, label, note]) => ({
                key,
                label,
                note,
                value: samples.counts[key] ?? 0,
                muted: key === 'REJECTED',
                to: allowed(canOrders, `${sampling}?status=${key}`),
              }))}
            />
            {samples.overdue ? (
              <AlertLink to={allowed(canOrders, `${sampling}?status=IN_PROGRESS`)}>
                {fmt.count(samples.overdue)} sample{samples.overdue === 1 ? ' is' : 's are'} past the
                date due to the buyer
              </AlertLink>
            ) : null}
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------ needs attention */}
      <section className="flex flex-col gap-4">
        <SectionHeading title="Needs attention" />
        <div className="grid gap-4 lg:grid-cols-5">
          <Card
            className="lg:col-span-3"
            title="Late or due this week"
            subtitle="Most overdue first, then by deadline"
            action={<CardLink to={allowed(canOrders, list)} />}
          >
            <DueList orders={orders.dueSoon} palette={palette} orderLink={allowed(canOrders, list)} />
          </Card>

          <Card
            className="lg:col-span-2"
            title="Top buyers"
            subtitle={`By metres still to make · ${fmt.count(orders.activeBuyers)} active buyers`}
            action={<CardLink to={allowed(canOrders, ROUTES.ADMIN_ORDERS_COMPANIES)} />}
          >
            <BarList
              color={palette.primary}
              formatValue={fmt.metres}
              emptyText="No open orders right now."
              rows={orders.topBuyers.map((b) => ({
                key: b.companyId,
                label: b.name,
                note: `${b.orders} order${b.orders === 1 ? '' : 's'}`,
                value: b.remainingMetres,
                to: allowed(canOrders, companyPath(b.companyId)),
              }))}
            />
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------ stock & spending */}
      {stock ? (
        <section className="flex flex-col gap-4">
          <SectionHeading title="Stock & spending" />
          <div className="grid gap-4 lg:grid-cols-5">
            <Card
              className="lg:col-span-3"
              title="Expenses"
              subtitle="Last 6 months"
              action={<CardLink to={allowed(canStock, ROUTES.ADMIN_INVENTORY_EXPENSES)} />}
            >
              <ExpensesChart months={stock.expenses.months} palette={palette} />
              <NumbersTable
                caption="Expenses per month"
                columns={['Month', 'Spent']}
                rows={[...stock.expenses.months].reverse().map((m) => [fmt.monthName(m.month, 'long'), fmt.rupees(m.paise)])}
              />
            </Card>

            <Card
              className="lg:col-span-2"
              title="Needs a stock count"
              subtitle={`${fmt.count(stock.entriesToday)} stock entr${stock.entriesToday === 1 ? 'y' : 'ies'} today`}
              action={<CardLink to={allowed(canStock, ROUTES.ADMIN_INVENTORY_MATERIALS)}>Open</CardLink>}
            >
              {stock.needsCount.items.length ? (
                <>
                  <AlertLink to={allowed(canStock, ROUTES.ADMIN_INVENTORY_MATERIALS)}>
                    {fmt.count(stock.needsCount.count)} item{stock.needsCount.count === 1 ? '' : 's'} went
                    below zero — count and correct
                  </AlertLink>
                  <ul className="flex flex-col divide-y divide-brand-ink/8">
                    {stock.needsCount.items.map((i) => (
                      <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate font-body text-sm font-semibold text-brand-ink">
                            {i.name}
                          </span>
                          <span className="block font-body text-xs text-brand-ink/50">
                            {CATEGORY_LABELS[i.category] ?? i.category}
                          </span>
                        </span>
                        <span className="shrink-0 font-body text-sm font-semibold text-critical tabular-nums">
                          {fmt.count(i.balance)} {i.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="flex items-center gap-2 font-body text-sm text-brand-ink/55">
                  <FiCheckCircle aria-hidden className="text-good" /> Every stock figure adds
                  up.
                </p>
              )}
            </Card>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------ enquiries */}
      <section className="flex flex-col gap-4">
        <SectionHeading title="Enquiries" />
        <div className="grid gap-4 lg:grid-cols-5">
          <Card
            className="lg:col-span-3"
            title="Latest enquiries"
            action={<CardLink to={allowed(canEnquiries, ROUTES.ADMIN_ENQUIRIES)} />}
          >
            {enquiries.recent.length ? (
              <ul className="flex flex-col gap-1">
                {enquiries.recent.map((e) => {
                  const body = (
                    <>
                      <span
                        aria-hidden
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-pink/10 font-body text-sm font-bold text-brand-pink"
                      >
                        {(e.name || '?').trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-body text-sm font-semibold text-brand-ink">{e.name}</span>
                          {e.status === 'NEW' ? (
                            <span className="rounded-full bg-brand-pink/12 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-brand-pink">
                              New
                            </span>
                          ) : null}
                          {e.company ? (
                            <span className="font-body text-xs text-brand-ink/45">{e.company}</span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate font-body text-[13px] text-brand-ink/60">
                          {e.message}
                        </span>
                      </span>
                      <span className="shrink-0 font-body text-[11px] text-brand-ink/45">
                        {fmt.shortDate(new Date(e.createdAt).toISOString())}
                      </span>
                    </>
                  );
                  return (
                    <li key={e.id}>
                      {canEnquiries ? (
                        <Link
                          to={ROUTES.ADMIN_ENQUIRIES}
                          className="flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-brand-ink/4"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 p-2.5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                className="min-h-48"
                icon={FiInbox}
                title="No enquiries yet"
                hint="Messages sent through the website’s enquiry form will appear here."
              />
            )}
          </Card>

          <Card className="lg:col-span-2" title="Enquiries per week" subtitle="Last 12 weeks">
            <EnquiriesChart weeks={enquiries.weeks} palette={palette} />
            <NumbersTable
              caption="Enquiries per week"
              columns={['Week of', 'Enquiries']}
              rows={[...enquiries.weeks].reverse().map((w) => [fmt.shortDate(w.week), fmt.count(w.count)])}
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
