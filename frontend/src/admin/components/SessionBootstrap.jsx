import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { refresh as refreshSession } from '../../api/auth.api.js';

/**
 * Restores a session on a cold load, then clears the bootstrapping flag.
 *
 * The persisted access token is short-lived (15 minutes), so after a browser
 * restart it is usually already expired while the refresh cookie — which lives
 * for 30 days — is still good. Trading it in here is what keeps an admin signed
 * in across restarts instead of being bounced to the login screen.
 *
 * Renders nothing; it exists purely for the effect.
 */
export default function SessionBootstrap() {
  const setAuth = useAppStore((s) => s.setAuth);
  const finishBootstrap = useAppStore((s) => s.finishBootstrap);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    let cancelled = false;

    // Called directly rather than through the axios instance: a 401 here is
    // the expected "no session" case, and routing it through the interceptor
    // would trigger a second, pointless refresh attempt.
    refreshSession()
      .then(({ user, accessToken }) => {
        if (!cancelled) setAuth({ user, accessToken });
      })
      .catch(() => {
        // No valid cookie — a normal signed-out visitor.
        if (!cancelled) logout();
      })
      .finally(() => {
        // Must run on both paths. Leaving the flag set would hang every guard
        // on its loading state forever.
        if (!cancelled) finishBootstrap();
      });

    return () => {
      cancelled = true;
    };
  }, [setAuth, finishBootstrap, logout]);

  return null;
}
