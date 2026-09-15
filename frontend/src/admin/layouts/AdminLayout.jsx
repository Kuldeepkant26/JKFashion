import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAppStore } from '../../store/useAppStore.js';
import { logout as logoutRequest } from '../../api/auth.api.js';
import { ROUTES } from '../../constants/routePaths.js';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

/**
 * Chrome for the admin panel.
 *
 * Two overrides on the root undo global rules from index.css that would
 * otherwise leak in: `scroll-auto` defeats `html { scroll-behavior:
 * smooth }` (which makes the drawer and nav jumps animate oddly), and
 * `font-body` claims the token font explicitly rather than inheriting it.
 *
 * Z-index stays in a low, self-contained band (20/30/40). The marketing
 * components that use 9998-2147483000 never mount on /admin, so there is
 * nothing here to compete with.
 */
export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  // Persisted in the store, so a collapsed rail stays collapsed across reloads.
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleCollapse = useAppStore((s) => s.toggleSidebar);
  const navigate = useNavigate();
  const location = useLocation();

  // Close the drawer on navigation, or it stays open over the page just opened.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Escape closes the drawer — expected of anything modal-like.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutRequest();
    } catch {
      // Clearing the local session matters more than the round-trip. If the
      // request failed the refresh token stays server-side, but this browser
      // has forgotten it either way.
    }
    logout();
    navigate(ROUTES.ADMIN_LOGIN, { replace: true });
  };

  return (
    <div className="font-body min-h-screen bg-admin-cream text-brand-ink scroll-auto">
      {/* ---------------------------------------- mobile top bar */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 border-b border-brand-ink/8
                   bg-admin-cream/95 px-4 py-3 backdrop-blur lg:hidden"
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          className="grid h-9 w-9 place-items-center rounded-lg text-brand-ink
                     transition-colors hover:bg-brand-ink/5
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-brand-pink"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <img src={logo} alt={company.name} className="h-7 w-auto object-contain" />
      </header>

      {/* ---------------------------------------- drawer backdrop */}
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      ) : null}

      {/* ---------------------------------------- sidebar */}
      {/*
        The right border is what separates the sidebar from the page on
        desktop. Previously `lg:shadow-none` removed the drawer's shadow once
        pinned and nothing replaced it, so two near-identical surfaces met with
        no edge at all. A hairline border plus a soft shadow reads as a panel
        rather than a colour change.
      */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto shadow-xl
                    transition-[transform,width] duration-300 ease-out
                    lg:translate-x-0 lg:border-r lg:border-brand-ink/10
                    lg:shadow-[1px_0_3px_rgba(0,0,0,0.04)]
                    ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${collapsed ? 'lg:w-[76px]' : 'lg:w-72'}`}
      >
        <Sidebar
          user={user}
          onNavigate={() => setDrawerOpen(false)}
          onSignOut={handleSignOut}
          signingOut={signingOut}
          /* The drawer is always full width, so the rail only applies once the
             sidebar is pinned. */
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* ---------------------------------------- page */}
      <main
        className={`px-4 py-6 transition-[padding] duration-300 ease-out sm:px-6 lg:py-8
                    lg:pr-8 ${collapsed ? 'lg:pl-[108px]' : 'lg:pl-76'}`}
      >
        {/* Child routes are lazy too, so they need a boundary of their own —
            the one wrapping this layout has already resolved by now. */}
        <Suspense
          fallback={
            <div className="grid min-h-[60vh] place-items-center">
              <Spinner label="Loading" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
