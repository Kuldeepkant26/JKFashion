import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { refresh as refreshSession } from '../../api/auth.api.js';
import { getTokenExpiryMs } from '../../utils/jwt.js';

/**
 * Restores a session on a cold load, then keeps it alive proactively for as
 * long as the tab is open.
 *
 * The access token is short-lived (15 minutes) by design, but the ONLY thing
 * that used to renew it was the axios interceptor reacting to a 401 — which
 * means an admin who spends 15+ minutes reading a page or filling a form
 * without the app happening to call the API would sit on an expired token
 * until their next click, at the mercy of whatever that click's error
 * handling did with it. That read as "logged out after 10-15 minutes."
 *
 * This schedules a silent refresh a fixed margin BEFORE the current token
 * expires, and reschedules itself after every renewal — so, barring the
 * browser closing or a real 30-day refresh-cookie expiry, a signed-in admin
 * never actually holds a dead token during normal use.
 *
 * Renders nothing; it exists purely for the effect.
 */

// Refresh this long before expiry. Wide enough to absorb clock drift and a
// slow network without ever letting the countdown reach zero.
const REFRESH_MARGIN_MS = 60_000;

// Token lifetime is configurable server-side (JWT_ACCESS_EXPIRES_IN); if the
// JWT is ever unreadable, fall back to a conservative fixed interval rather
// than not refreshing at all.
const FALLBACK_INTERVAL_MS = 10 * 60_000;

export default function SessionBootstrap() {
  const setAuth = useAppStore((s) => s.setAuth);
  const finishBootstrap = useAppStore((s) => s.finishBootstrap);
  const logout = useAppStore((s) => s.logout);

  // Guards the initial bootstrap against React StrictMode's double-invoked
  // effect in dev: two near-simultaneous calls would both present the same
  // refresh token, and rotation is single-use, so the loser gets treated as
  // a replay and both browsers' sessions get dropped. A ref (not state)
  // because this must be visible to the second invocation synchronously,
  // before either request has resolved.
  const bootstrapped = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timerId = null;

    const scheduleNext = (accessToken) => {
      window.clearTimeout(timerId);

      const expiryMs = getTokenExpiryMs(accessToken);
      const delay = expiryMs
        ? Math.max(0, expiryMs - Date.now() - REFRESH_MARGIN_MS)
        : FALLBACK_INTERVAL_MS;

      timerId = window.setTimeout(runRefresh, delay);
    };

    const runRefresh = async () => {
      try {
        const { user, accessToken } = await refreshSession();
        if (cancelled) return;
        setAuth({ user, accessToken });
        scheduleNext(accessToken);
      } catch {
        // Refresh cookie is gone or expired (30-day session genuinely over,
        // or the account was deactivated) — sign out for real.
        if (!cancelled) logout();
      }
    };

    if (bootstrapped.current) {
      // StrictMode's remount: the first pass already started the session and
      // its own refresh timer. Re-running the cold-load fetch would burn the
      // refresh token a second time for nothing.
      return () => {
        cancelled = true;
        window.clearTimeout(timerId);
      };
    }
    bootstrapped.current = true;

    // Called directly rather than through the axios instance: a 401 here is
    // the expected "no session" case, and routing it through the interceptor
    // would trigger a second, pointless refresh attempt.
    refreshSession()
      .then(({ user, accessToken }) => {
        if (cancelled) return;
        setAuth({ user, accessToken });
        scheduleNext(accessToken);
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
      window.clearTimeout(timerId);
    };
  }, [setAuth, finishBootstrap, logout]);

  return null;
}
