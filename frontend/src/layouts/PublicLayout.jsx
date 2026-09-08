import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import SiteNavbar from '../components/navbars/index.jsx';
import SplashScreen from '../components/SplashScreen';

/**
 * Chrome for the public marketing site: splash screen and navbar.
 *
 * The navbar is chosen by the owner in the admin panel; SiteNavbar resolves
 * that id to a component, so this layout never needs to know which one.
 *
 * These used to live in App.jsx and therefore rendered on every route. Moving
 * them here makes the admin panel's isolation structural — /admin sits outside
 * this layout, so it cannot inherit the marketing chrome by accident.
 */
export default function PublicLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [exitingSplash, setExitingSplash] = useState(false);

  useEffect(() => {
    // Matches the splash animation: wipe + draw + wordmark settle ≈ 2.6s.
    // The shell un-masks at exit (not at hide) so the page fades up behind
    // the splash as it fades out, rather than after it.
    const exitTimer = setTimeout(() => setExitingSplash(true), 3000);
    const hideTimer = setTimeout(() => setShowSplash(false), 3550);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen exiting={exitingSplash} />}
      <div className={`app-shell ${showSplash && !exitingSplash ? 'app-shell--masked' : 'app-shell--ready'}`}>
        <SiteNavbar />
        <Outlet />
      </div>
    </>
  );
}
