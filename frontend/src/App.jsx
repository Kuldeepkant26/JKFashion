import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { ROUTES } from './constants/routePaths.js';

import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';

import SessionBootstrap from './admin/components/SessionBootstrap.jsx';
import ThemeBootstrap from './theme/ThemeBootstrap.jsx';
import Spinner from './admin/components/Spinner.jsx';
import {
  ProtectedRoute,
  PublicOnlyRoute,
  OwnerRoute,
  PermissionRoute,
} from './routes/guards.jsx';
import { landingRouteFor } from './constants/permissions.js';
import { useAppStore } from './store/useAppStore.js';

/**
 * The admin panel is code-split.
 *
 * Nobody can reach the panel without signing in, so its screens have no
 * business in the bundle every marketing visitor downloads.
 */
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminPlaceholder = lazy(() => import('./admin/pages/AdminPlaceholder'));
const AdminEnquiries = lazy(() => import('./admin/pages/AdminEnquiries.jsx'));
const AdminStaff = lazy(() => import('./admin/pages/AdminStaff.jsx'));
const AdminNoAccess = lazy(() => import('./admin/pages/AdminNoAccess.jsx'));
const OrdersLayout = lazy(() => import('./admin/pages/orders/OrdersLayout.jsx'));
const CompaniesTab = lazy(() => import('./admin/pages/orders/CompaniesTab.jsx'));
const OrdersTab = lazy(() => import('./admin/pages/orders/OrdersTab.jsx'));
const StockLayout = lazy(() => import('./admin/pages/stock/StockLayout.jsx'));
const StockOverviewTab = lazy(() => import('./admin/pages/stock/OverviewTab.jsx'));
const StockMaterialsTab = lazy(() => import('./admin/pages/stock/MaterialsTab.jsx'));
const StockReportTab = lazy(() => import('./admin/pages/stock/ReportTab.jsx'));
const StockExpensesTab = lazy(() => import('./admin/pages/stock/ExpensesTab.jsx'));
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

  // Derived from what this account may actually open — a fixed Inventory
  // fallback would bounce a staff member who was never granted it.
  return <Navigate to={landingRouteFor(user)} replace />;
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
              <PermissionRoute section="DASHBOARD">
                <AdminDashboard />
              </PermissionRoute>
            }
          />
          <Route path="no-access" element={<AdminNoAccess />} />
          {/* Orders is a section with its own tabs; the bare path lands on
              the first one so /admin/orders is never a blank screen. */}
          <Route
            path="orders"
            element={
              <PermissionRoute section="INVENTORY">
                <OrdersLayout />
              </PermissionRoute>
            }
          >
            <Route index element={<Navigate to={ROUTES.ADMIN_ORDERS_COMPANIES} replace />} />
            <Route path="companies" element={<CompaniesTab />} />
            <Route path="list" element={<OrdersTab />} />
          </Route>

          {/*
            Orders used to live under /admin/inventory, which now belongs to
            the stock ledger below. These are the two paths people have
            bookmarked, so they redirect to where those screens moved.
            Declared before the stock section for legibility — the router
            ranks by specificity, not source order, so these would win either
            way, but a reader should not have to know that.
          */}
          <Route
            path="inventory/orders"
            element={<Navigate to={ROUTES.ADMIN_ORDERS_LIST} replace />}
          />
          <Route
            path="inventory/companies"
            element={<Navigate to={ROUTES.ADMIN_ORDERS_COMPANIES} replace />}
          />

          {/* The daily materials ledger. A separate section and permission —
              this is stock on the floor, not the orders it is worked against. */}
          <Route
            path="inventory"
            element={
              <PermissionRoute section="STOCK">
                <StockLayout />
              </PermissionRoute>
            }
          >
            <Route index element={<Navigate to={ROUTES.ADMIN_INVENTORY_OVERVIEW} replace />} />
            <Route path="overview" element={<StockOverviewTab />} />
            <Route path="materials" element={<StockMaterialsTab />} />
            <Route path="report" element={<StockReportTab />} />
            <Route path="expenses" element={<StockExpensesTab />} />
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
              <PermissionRoute section="ENQUIRIES">
                <AdminEnquiries />
              </PermissionRoute>
            }
          />
          <Route
            path="content"
            element={
              <PermissionRoute section="CONTENT">
                <AdminPlaceholder title="Content" />
              </PermissionRoute>
            }
          />
          {/* Settings is a section with its own tabs; the bare path lands on
              the first one so /admin/settings is never a blank screen. */}
          <Route
            path="settings"
            element={
              <PermissionRoute section="SETTINGS">
                <SettingsLayout />
              </PermissionRoute>
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
