import { NavLink } from 'react-router-dom';

/**
 * The tab strip a section's sub-pages hang off.
 *
 * Extracted once a third section needed it — settings, orders and the stock
 * ledger were carrying byte-identical markup, which is three places for a
 * focus ring or a spacing tweak to go out of step.
 *
 * It scrolls rather than wraps: a tab bar that reflows onto two lines stops
 * reading as one control.
 *
 * @param tabs  [{ to, label }] — `to` is an absolute route from ROUTES
 * @param label accessible name for the nav landmark, e.g. "Inventory sections"
 */
export default function TabBar({ tabs, label }) {
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <nav
        className="flex min-w-max gap-1 rounded-2xl bg-brand-ink/4 p-1"
        aria-label={label}
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
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
  );
}
