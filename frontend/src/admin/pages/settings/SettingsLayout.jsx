import { Outlet } from 'react-router-dom';
import { useAppStore } from '../../../store/useAppStore.js';
import { ROUTES } from '../../../constants/routePaths.js';
import EmptyState from '../../components/EmptyState.jsx';
import TabBar from '../../components/TabBar.jsx';
import { MAIN_ADMIN } from '../../constants/ui.js';
import { FiLock } from 'react-icons/fi';

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
  { to: ROUTES.ADMIN_SETTINGS_HOME, label: 'Hero & Contact' },
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

      <TabBar tabs={TABS} label="Settings sections" />

      <Outlet />
    </div>
  );
}
