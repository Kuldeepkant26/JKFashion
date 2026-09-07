import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../data/navItems.js';
import Avatar from '../components/Avatar.jsx';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

const NavIcon = ({ d }) => (
  <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
    <path d={d} fill="currentColor" />
  </svg>
);

/**
 * The sidebar itself. Positioning (drawer vs pinned) is handled by AdminLayout;
 * this component only renders the contents.
 */
export default function Sidebar({ user, onNavigate, onSignOut, signingOut }) {
  return (
    <div className="flex h-full flex-col bg-admin-sidebar px-4 py-6">
      {/* brand */}
      <div className="mb-8 flex items-center gap-2.5 px-1">
        <img src={logo} alt={company.name} className="h-9 w-auto object-contain" />
      </div>

      {/* who is signed in */}
      <div className="mb-8 flex flex-col items-center gap-2.5 text-center">
        <Avatar name={user?.name} size="lg" />
        <div>
          <p className="font-body text-sm font-semibold text-brand-ink">{user?.name}</p>
          <p className="font-body text-xs text-brand-ink/50">
            {user?.role === 'MAIN_ADMIN' ? 'Administrator' : 'Editor'}
          </p>
        </div>
      </div>

      {/* navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-sm
               transition-colors focus-visible:outline-2 focus-visible:outline-offset-2
               focus-visible:outline-brand-pink ${
                 isActive
                   ? 'bg-brand-pink text-white font-semibold'
                   : 'text-brand-ink/65 hover:bg-brand-pink/8 hover:text-brand-ink'
               }`
            }
          >
            <NavIcon d={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className="mt-4 flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-sm
                   text-brand-ink/60 transition-colors hover:bg-brand-ink/5 hover:text-brand-ink
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-brand-pink disabled:opacity-60"
      >
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
          <path
            d="M12 6V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2M8 10h9m0 0-3-3m3 3-3 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{signingOut ? 'Signing out…' : 'Log out'}</span>
      </button>
    </div>
  );
}
