import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore.js';
import { ROUTES } from '../constants/routePaths.js';
import { hasPermission, landingRouteFor } from '../constants/permissions.js';
import Spinner from '../admin/components/Spinner.jsx';

const Bootstrapping = () => (
  <div className="grid min-h-screen place-items-center bg-admin-cream">
    <Spinner label="Restoring your session" />
  </div>
);

/** Requires a session. Sends everyone else to the login screen. */
export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isBootstrapping = useAppStore((s) => s.isBootstrapping);
  const location = useLocation();

  if (isBootstrapping) return <Bootstrapping />;

  // `state.from` is what lets the login screen return the admin to the page
  // they originally asked for rather than always the dashboard.
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />;
  }

  return children;
};

/**
 * Owner-only pages. Assumes `ProtectedRoute` has already established a session.
 *
 * Redirects rather than showing a locked panel, because an employee has no
 * business on these routes at all — unlike Settings, which shows an explanatory
 * "owner access only" screen since its tab bar is visible to everyone.
 *
 * This is a convenience, not the security boundary: the API's own `restrictTo`
 * is what actually refuses the request.
 */
export const OwnerRoute = ({ children }) => {
  const user = useAppStore((s) => s.user);

  // Employees land on a section they can actually open, which is no longer
  // always Inventory now that access is granted per account.
  if (user?.role !== 'MAIN_ADMIN') {
    return <Navigate to={landingRouteFor(user)} replace />;
  }

  return children;
};

/**
 * Requires a granted section. Assumes `ProtectedRoute` ran first.
 *
 * Redirects to whatever the account CAN open rather than to a fixed route —
 * previously every staff redirect assumed Inventory, which is now just one
 * grant among several and may not be theirs.
 *
 * A convenience, not the boundary: the API's `requirePermission` is what
 * actually refuses the data.
 */
export const PermissionRoute = ({ section, children }) => {
  const user = useAppStore((s) => s.user);

  if (!hasPermission(user, section)) {
    return <Navigate to={landingRouteFor(user)} replace />;
  }

  return children;
};

/** Keeps an already signed-in admin off the login screen. */
export const PublicOnlyRoute = ({ children }) => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isBootstrapping = useAppStore((s) => s.isBootstrapping);

  if (isBootstrapping) return <Bootstrapping />;
  if (isAuthenticated) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;

  return children;
};
