import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiPackage,
  FiMail,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { ROUTES } from '../../constants/routePaths.js';
import Avatar from '../components/Avatar.jsx';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

/**
 * Navigation, grouped.
 *
 * The groups exist so the rule between them means something: everything above
 * it is day-to-day work on content, everything below configures the site
 * itself. A single flat list of five would not need dividing.
 */
const NAV_GROUPS = [
  [
    { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', Icon: FiGrid },
    { to: ROUTES.ADMIN_PRODUCTS, label: 'Products', Icon: FiPackage },
    { to: ROUTES.ADMIN_ENQUIRIES, label: 'Enquiries', Icon: FiMail },
    { to: ROUTES.ADMIN_CONTENT, label: 'Content', Icon: FiFileText },
  ],
  [{ to: ROUTES.ADMIN_SETTINGS, label: 'Settings', Icon: FiSettings }],
];

/**
 * The sidebar itself. Positioning (drawer vs pinned) is handled by AdminLayout;
 * this component only renders the contents.
 *
 * `collapsed` narrows it to an icon rail on desktop. The drawer on mobile is
 * always full width — a 72px rail floating over the page would be harder to
 * use than the drawer it replaced, and there is no screen width to reclaim.
 */
export default function Sidebar({
  user,
  onNavigate,
  onSignOut,
  signingOut,
  collapsed = false,
  onToggleCollapse,
}) {
  return (
    <div
      className={`flex h-full flex-col bg-admin-sidebar py-5 transition-[padding] duration-200
                  ${collapsed ? 'px-3' : 'px-4'}`}
    >
      {/* ------------------------------------------------------ brand */}
      <div
        className={`mb-5 flex items-center gap-2 ${
          collapsed ? 'justify-center' : 'justify-between pl-1'
        }`}
      >
        {!collapsed ? (
          <img src={logo} alt={company.name} className="h-9 w-auto object-contain" />
        ) : null}

        {/* Desktop only: on mobile the drawer's own close control does this. */}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-brand-ink/40
                       transition-colors hover:bg-brand-ink/5 hover:text-brand-ink
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-brand-pink lg:grid"
          >
            {collapsed ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}
          </button>
        ) : null}
      </div>

      <span className="mb-5 block h-px bg-brand-ink/8" aria-hidden="true" />

      {/* ----------------------------------------------- who is signed in */}
      <div
        className={`mb-5 flex gap-2.5 ${
          collapsed ? 'flex-col items-center' : 'flex-col items-center text-center'
        }`}
      >
        <Avatar name={user?.name} size={collapsed ? 'sm' : 'lg'} />
        {!collapsed ? (
          <div>
            <p className="font-body text-sm font-semibold text-brand-ink">{user?.name}</p>
            <p className="font-body text-xs text-brand-ink/50">
              {user?.role === 'MAIN_ADMIN' ? 'Administrator' : 'Editor'}
            </p>
          </div>
        ) : null}
      </div>

      <span className="mb-4 block h-px bg-brand-ink/8" aria-hidden="true" />

      {/* ------------------------------------------------------- nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col gap-1">
            {/* A rule between groups, never above the first or below the last. */}
            {groupIndex > 0 ? (
              <span className="my-3 block h-px bg-brand-ink/8" aria-hidden="true" />
            ) : null}

            {group.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl py-2.5 font-body text-sm transition-colors
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-brand-pink
                   ${collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'} ${
                     isActive
                       ? 'bg-brand-pink text-on-primary font-semibold'
                       : 'text-brand-ink/65 hover:bg-brand-pink/8 hover:text-brand-ink'
                   }`
                }
              >
                <Icon size={18} className="shrink-0" aria-hidden="true" />
                {/* Hidden visually when collapsed but kept for screen readers,
                    which have no equivalent of a hover tooltip. */}
                <span className={collapsed ? 'sr-only' : ''}>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <span className="mt-4 mb-3 block h-px bg-brand-ink/8" aria-hidden="true" />

      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        title={collapsed ? 'Log out' : undefined}
        className={`flex items-center rounded-xl py-2.5 font-body text-sm text-brand-ink/60
                    transition-colors hover:bg-brand-ink/5 hover:text-brand-ink
                    focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-brand-pink disabled:opacity-60
                    ${collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'}`}
      >
        <FiLogOut size={18} className="shrink-0" aria-hidden="true" />
        <span className={collapsed ? 'sr-only' : ''}>
          {signingOut ? 'Signing out…' : 'Log out'}
        </span>
      </button>
    </div>
  );
}
