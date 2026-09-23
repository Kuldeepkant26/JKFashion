import { Outlet } from 'react-router-dom';
import { ROUTES } from '../../../constants/routePaths.js';
import TabBar from '../../components/TabBar.jsx';

const TABS = [
  { to: ROUTES.ADMIN_INVENTORY_OVERVIEW, label: 'Overview' },
  { to: ROUTES.ADMIN_INVENTORY_MATERIALS, label: 'Materials' },
  { to: ROUTES.ADMIN_INVENTORY_REPORT, label: 'Daily Report' },
  { to: ROUTES.ADMIN_INVENTORY_EXPENSES, label: 'Expenses' },
];

/**
 * Chrome for the inventory section: the heading and the tab bar.
 *
 * This is stock on the floor — what came in, what went out, what is left —
 * which is a different question from the Orders section's "what are we making
 * for whom".
 */
export default function StockLayout() {
  return (
    /*
     * `data-surface="data"` re-points the font variables for this subtree — see
     * index.css. A ledger is quantities and dates read off a screen and copied
     * onto a docket, so it wants a plain face with figures that line up in a
     * column rather than the site's display font.
     */
    <div data-surface="data" className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
          Inventory
        </h1>
        <p className="mt-1 text-sm text-brand-ink/55">
          Daily stock of yarn, fabric and supplies — what came in, what went out, and what is
          left.
        </p>
      </div>

      <TabBar tabs={TABS} label="Inventory sections" />

      <Outlet />
    </div>
  );
}
