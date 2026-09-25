import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TbCalculator } from 'react-icons/tb';
import { ROUTES } from '../../../constants/routePaths.js';
import TabBar from '../../components/TabBar.jsx';
import StitchCalculator from './StitchCalculator.jsx';

/**
 * The order the work is actually done in: a buyer exists, they are sampled,
 * an approved sample becomes a production order. Statistics sit last, apart
 * from the lists, so the lists open straight onto the work.
 */
const TABS = [
  { to: ROUTES.ADMIN_ORDERS_COMPANIES, label: 'Companies' },
  { to: ROUTES.ADMIN_ORDERS_SAMPLES, label: 'Sampling' },
  { to: ROUTES.ADMIN_ORDERS_LIST, label: 'Production' },
  { to: ROUTES.ADMIN_ORDERS_STATS, label: 'Statistics' },
];

/**
 * Chrome for the orders section: the heading, the calculator and the tab
 * bar. Each tab renders through the <Outlet />.
 *
 * No role gate here — this is one of the sections staff accounts are meant to
 * use. The owner-only actions inside it (deleting an order, a sample or a
 * company) are gated per control, against an API that refuses them anyway.
 */
export default function OrdersLayout() {
  const [calculating, setCalculating] = useState(false);

  return (
    /*
     * `data-surface="data"` re-points the font variables for this subtree only
     * — see the rule in index.css. This section shows quantities, dates and
     * order numbers that get read off a screen and typed into a docket, so it
     * uses a plain system face with aligned figures rather than the site's
     * display font. Everything outside this element keeps the brand typography.
     */
    <div data-surface="data" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
            Orders
          </h1>
          <p className="mt-1 text-sm text-brand-ink/55">
            Buyers, their samples, and the production orders confirmed from them.
          </p>
        </div>

        {/* Always one click away, whichever tab is open. */}
        <button
          type="button"
          onClick={() => setCalculating(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm
                     font-semibold text-brand-ink/70 ring-1 ring-brand-ink/12
                     transition-colors hover:bg-brand-ink/5"
        >
          <TbCalculator aria-hidden size={18} /> Calculator
        </button>
      </div>

      <StitchCalculator open={calculating} onClose={() => setCalculating(false)} />

      <TabBar tabs={TABS} label="Order sections" />

      <Outlet />
    </div>
  );
}
