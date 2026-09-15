import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiClipboard,
  FiMail,
  FiFileText,
  FiSettings,
  FiUsers,
  FiLogOut,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { ROUTES } from '../../constants/routePaths.js';
import { hasPermission } from '../../constants/permissions.js';
import Avatar from '../components/Avatar.jsx';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

/**
 * Navigation, grouped.
 *
 * The groups exist so the rule between them means something: everything above
 * it is day-to-day work, everything below configures the site and who can
 * reach it. A single flat list would not need dividing.
 *
 * `permission` hides an item the account has not been granted, and `ownerOnly`
 * hides one that is the owner's alone regardless of grants. Both are
 * affordances, not security boundaries — the API's `requirePermission` and
 * `restrictTo` are what actually refuse access. Showing a floor employee five
 * links that all bounce them elsewhere would just be noise.
 */
const NAV_GROUPS = [
  [
    { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', Icon: FiGrid, permission: 'DASHBOARD' },
    { to: ROUTES.ADMIN_INVENTORY, label: 'Inventory', Icon: FiClipboard, permission: 'INVENTORY' },
    { to: ROUTES.ADMIN_ENQUIRIES, label: 'Enquiries', Icon: FiMail, permission: 'ENQUIRIES' },
    { to: ROUTES.ADMIN_CONTENT, label: 'Content', Icon: FiFileText, permission: 'CONTENT' },
  ],
  [
    /* Never grantable — managing accounts is the ability to mint an owner. */
    { to: ROUTES.ADMIN_STAFF, label: 'Staff', Icon: FiUsers, ownerOnly: true },
    { to: ROUTES.ADMIN_SETTINGS, label: 'Settings', Icon: FiSettings, permission: 'SETTINGS' },
  ],
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
  /** Mirrors ROLES.MAIN_ADMIN on the API — the seeded owner. */
  const isOwner = user?.role === 'MAIN_ADMIN';

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
        {/*
          Filtered first, then emptied groups dropped: a staff account whose
          whole second group is owner-only must not get a divider rule with
          nothing under it. `groupIndex` is taken after the filter for the same
          reason — it decides where the rule goes.
        */}
        {NAV_GROUPS.map((group) =>
          group.filter((item) =>
            item.ownerOnly ? isOwner : hasPermission(user, item.permission)
          )
        )
          .filter((group) => group.length > 0)
          .map((group, groupIndex) => (
          <div key={group[0].to} className="flex flex-col gap-1">
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
