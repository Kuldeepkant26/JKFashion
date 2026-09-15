import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { ROUTES } from './constants/routePaths.js';

import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';

import SessionBootstrap from './admin/components/SessionBootstrap.jsx';
import ThemeBootstrap from './theme/ThemeBootstrap.jsx';
import Spinner from './admin/components/Spinner.jsx';
import { ProtectedRoute, PublicOnlyRoute, OwnerRoute } from './routes/guards.jsx';
import { useAppStore } from './store/useAppStore.js';

/**
 * The admin panel is code-split.
 *
 * It pulls in recharts, which is ~450KB — loading that on the marketing site,
 * where nobody can even reach the panel without signing in, would nearly double
 * the bundle every visitor downloads.
 */
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminPlaceholder = lazy(() => import('./admin/pages/AdminPlaceholder'));
const AdminEnquiries = lazy(() => import('./admin/pages/AdminEnquiries.jsx'));
const AdminStaff = lazy(() => import('./admin/pages/AdminStaff.jsx'));
const InventoryLayout = lazy(() => import('./admin/pages/inventory/InventoryLayout.jsx'));
const CompaniesTab = lazy(() => import('./admin/pages/inventory/CompaniesTab.jsx'));
const OrdersTab = lazy(() => import('./admin/pages/inventory/OrdersTab.jsx'));
const SettingsLayout = lazy(() => import('./admin/pages/settings/SettingsLayout.jsx'));
const ThemeTab = lazy(() => import('./admin/pages/settings/ThemeTab.jsx'));
const FontTab = lazy(() => import('./admin/pages/settings/FontTab.jsx'));
const LayoutTab = lazy(() => import('./admin/pages/settings/LayoutTab.jsx'));
const GalleryTab = lazy(() => import('./admin/pages/settings/GalleryTab.jsx'));
const ProcessTab = lazy(() => import('./admin/pages/settings/ProcessTab.jsx'));
const HomeContentTab = lazy(() => import('./admin/pages/settings/HomeContentTab.jsx'));

const AdminFallback = () => (
  <div className="grid min-h-screen place-items-center bg-admin-cream">
    <Spinner label="Loading" />
  </div>
);

/**
 * Where /admin lands, by role.
 *
 * The owner gets the dashboard; a staff account gets Inventory, which is the
 * only section they can open. A fixed redirect to the dashboard would bounce
 * every employee straight back out again.
 */
const AdminHome = () => {
  const user = useAppStore((s) => s.user);

  return (
    <Navigate
      to={user?.role === 'MAIN_ADMIN' ? ROUTES.ADMIN_DASHBOARD : ROUTES.ADMIN_INVENTORY}
      replace
    />
  );
};

/**
 * Two route trees that share nothing.
 *
 * The admin branch is declared first and carries its own catch-all nested
 * inside it, so an unknown /admin path lands on the dashboard rather than
 * being swallowed by the public catch-all and bounced to the marketing home.
 *
 * The marketing chrome (splash, navbar) lives inside PublicLayout — that is
 * what structurally guarantees the panel never inherits it.
 */
function App() {
  return (
    <Router>
      <ScrollToTop />
      <SessionBootstrap />
      <ThemeBootstrap />
      <Routes>
        {/* ---------------------------------------------------- admin */}
        <Route
          path={ROUTES.ADMIN_LOGIN}
          element={
            <PublicOnlyRoute>
              <Suspense fallback={<AdminFallback />}>
                <AdminLogin />
              </Suspense>
            </PublicOnlyRoute>
          }
        />

        <Route
          path={ROUTES.ADMIN}
          element={
            <ProtectedRoute>
              <Suspense fallback={<AdminFallback />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          {/* Role-aware landing: an employee cannot see the dashboard, so
              sending them there would be a redirect into a locked door. */}
          <Route index element={<AdminHome />} />
          <Route
            path="dashboard"
            element={
              <OwnerRoute>
                <AdminDashboard />
              </OwnerRoute>
            }
          />
          {/* Inventory is a section with its own tabs; the bare path lands on
              the first one so /admin/inventory is never a blank screen. */}
          <Route path="inventory" element={<InventoryLayout />}>
            <Route index element={<Navigate to={ROUTES.ADMIN_INVENTORY_ORDERS} replace />} />
            <Route path="orders" element={<OrdersTab />} />
            <Route path="companies" element={<CompaniesTab />} />
          </Route>
          <Route
            path="staff"
            element={
              <OwnerRoute>
                <AdminStaff />
              </OwnerRoute>
            }
          />
          <Route
            path="enquiries"
            element={
              <OwnerRoute>
                <AdminEnquiries />
              </OwnerRoute>
            }
          />
          <Route
            path="content"
            element={
              <OwnerRoute>
                <AdminPlaceholder title="Content" />
              </OwnerRoute>
            }
          />
          {/* Settings is a section with its own tabs; the bare path lands on
              the first one so /admin/settings is never a blank screen. */}
          <Route
            path="settings"
            element={
              <OwnerRoute>
                <SettingsLayout />
              </OwnerRoute>
            }
          >
            <Route index element={<Navigate to={ROUTES.ADMIN_SETTINGS_APPEARANCE} replace />} />
            <Route path="appearance" element={<ThemeTab />} />
            <Route path="typography" element={<FontTab />} />
            <Route path="layout" element={<LayoutTab />} />
            <Route path="gallery" element={<GalleryTab />} />
            <Route path="how-we-work" element={<ProcessTab />} />
            <Route path="hero-content" element={<HomeContentTab />} />
          </Route>
          <Route path="*" element={<AdminHome />} />
        </Route>

        {/* ------------------------------------------- public website */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          {/* The site is a single page: the old /about and /residential routes
              are gone, and their content is reached by scrolling. Any unknown
              path falls back home. */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
