import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SplashScreen from '../components/SplashScreen';
import WhatsAppFab from '../components/WhatsAppFab';

/**
 * Chrome for the public marketing site: splash screen, navbar and the WhatsApp
 * button.
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
        <Navbar />
        <Outlet />
        {!showSplash && <WhatsAppFab />}
      </div>
    </>
  );
}
