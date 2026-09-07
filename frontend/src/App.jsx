import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { ROUTES } from './constants/routePaths.js';

import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';
import Residentials from './pages/Residentials';
import About from './pages/About';

import SessionBootstrap from './admin/components/SessionBootstrap.jsx';
import ThemeBootstrap from './theme/ThemeBootstrap.jsx';
import Spinner from './admin/components/Spinner.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './routes/guards.jsx';

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
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings'));

const AdminFallback = () => (
  <div className="grid min-h-screen place-items-center bg-admin-cream">
    <Spinner label="Loading" />
  </div>
);

/**
 * Two route trees that share nothing.
 *
 * The admin branch is declared first and carries its own catch-all nested
 * inside it, so an unknown /admin path lands on the dashboard rather than
 * being swallowed by the public catch-all and bounced to the marketing home.
 *
 * The marketing chrome (splash, navbar, WhatsApp button) lives inside
 * PublicLayout — that is what structurally guarantees the panel never
 * inherits it.
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
          <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminPlaceholder title="Products" />} />
          <Route path="enquiries" element={<AdminPlaceholder title="Enquiries" />} />
          <Route path="content" element={<AdminPlaceholder title="Content" />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
        </Route>

        {/* ------------------------------------------- public website */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.PRODUCTS} element={<Residentials />} />
          <Route path={ROUTES.ABOUT} element={<About />} />
          {/* Any unknown path (incl. the removed /commercial) falls back home */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
