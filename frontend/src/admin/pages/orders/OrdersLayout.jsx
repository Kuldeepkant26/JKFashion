import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../../../constants/routePaths.js';

/**
 * The tabs. A data array rather than markup so adding a section is one line
 * here plus a route.
 */
const TABS = [
  { to: ROUTES.ADMIN_INVENTORY_ORDERS, label: 'Production Orders' },
  { to: ROUTES.ADMIN_INVENTORY_COMPANIES, label: 'Companies' },
];

/**
 * Chrome for the inventory section: the heading and the tab bar. Each tab
 * renders through the <Outlet />.
 *
 * No role gate here — this is the one section staff accounts are meant to use.
 * The owner-only actions inside it (deleting an order or a company) are gated
 * per control, against an API that refuses them anyway.
 */
export default function InventoryLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
          Inventory
        </h1>
        <p className="mt-1 text-sm text-brand-ink/55">
          Production orders on the floor, and the buyers they are for.
        </p>
      </div>

      {/* Scrolls rather than wraps on a narrow screen: a tab bar that reflows
          onto two lines stops reading as one control. */}
      <div className="-mx-1 overflow-x-auto pb-1">
        <nav
          className="flex min-w-max gap-1 rounded-2xl bg-brand-ink/[0.04] p-1"
          aria-label="Inventory sections"
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2.5 font-body text-sm font-semibold transition-colors
                 focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-brand-pink ${
                   isActive
                     ? 'bg-surface-card text-brand-ink shadow-sm'
                     : 'text-brand-ink/55 hover:text-brand-ink'
                 }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
