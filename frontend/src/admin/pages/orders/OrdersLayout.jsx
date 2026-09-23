import { Outlet } from 'react-router-dom';
import { ROUTES } from '../../../constants/routePaths.js';
import TabBar from '../../components/TabBar.jsx';

/**
 * Companies lead: a buyer has to exist before an order can be raised against
 * one, so that is the order the work is actually done in.
 */
const TABS = [
  { to: ROUTES.ADMIN_ORDERS_COMPANIES, label: 'Companies' },
  { to: ROUTES.ADMIN_ORDERS_LIST, label: 'Production Orders' },
];

/**
 * Chrome for the orders section: the heading and the tab bar. Each tab renders
 * through the <Outlet />.
 *
 * No role gate here — this is one of the sections staff accounts are meant to
 * use. The owner-only actions inside it (deleting an order or a company) are
 * gated per control, against an API that refuses them anyway.
 */
export default function OrdersLayout() {
  return (
    /*
     * `data-surface="data"` re-points the font variables for this subtree only
     * — see the rule in index.css. This section shows quantities, dates and
     * order numbers that get read off a screen and typed into a docket, so it
     * uses a plain system face with aligned figures rather than the site's
     * display font. Everything outside this element keeps the brand typography.
     */
    <div data-surface="data" className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-brand-ink/55">
          Production orders on the floor, and the buyers they are for.
        </p>
      </div>

      <TabBar tabs={TABS} label="Order sections" />

      <Outlet />
    </div>
  );
}
