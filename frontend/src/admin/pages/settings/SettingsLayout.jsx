import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '../../../store/useAppStore.js';
import { ROUTES } from '../../../constants/routePaths.js';
import EmptyState from '../../components/EmptyState.jsx';
import { FiLock } from 'react-icons/fi';

/** Mirrors ROLES.MAIN_ADMIN on the API — the seeded owner. */
const MAIN_ADMIN = 'MAIN_ADMIN';

/**
 * The tabs. A data array rather than markup so adding a settings area is one
 * line here plus a route — which is the whole reason this section is split
 * into tabs instead of one long page.
 */
const TABS = [
  { to: ROUTES.ADMIN_SETTINGS_APPEARANCE, label: 'Colour Theme' },
  { to: ROUTES.ADMIN_SETTINGS_TYPOGRAPHY, label: 'Font Style' },
  { to: ROUTES.ADMIN_SETTINGS_LAYOUT, label: 'Navbar & Hero' },
  { to: ROUTES.ADMIN_SETTINGS_GALLERY, label: 'Gallery' },
  { to: ROUTES.ADMIN_SETTINGS_PROCESS, label: 'How We Work' },
  { to: ROUTES.ADMIN_SETTINGS_HOME, label: 'Hero Content' },
];

/**
 * Chrome for the settings section: the heading, the owner check, and the tab
 * bar. Each tab renders through the <Outlet />.
 *
 * The role gate lives here rather than in each tab, so a new tab cannot
 * accidentally ship without it.
 */
export default function SettingsLayout() {
  const user = useAppStore((s) => s.user);
  const isOwner = user?.role === MAIN_ADMIN;

  if (!isOwner) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
          Settings
        </h1>
        <EmptyState
          className="min-h-[50vh] bg-surface-card"
          icon={FiLock}
          title="Owner access only"
          hint="Only the main administrator can change the site appearance."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-brand-ink/55">
          How the site looks — the public pages and this admin panel.
        </p>
      </div>

      {/* Scrolls rather than wraps on a narrow screen: a tab bar that reflows
          onto two lines stops reading as one control. */}
      <div className="-mx-1 overflow-x-auto pb-1">
        <nav
          className="flex min-w-max gap-1 rounded-2xl bg-brand-ink/[0.04] p-1"
          aria-label="Settings sections"
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
