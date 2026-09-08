/**
 * Reads the `exp` claim out of a JWT without verifying it.
 *
 * No verification is needed here: the token was just issued by our own
 * backend over an HTTPS/same-origin request, and the browser cannot forge a
 * signature the backend would accept anyway. This exists purely so the
 * frontend can schedule a refresh ahead of expiry instead of waiting for a
 * request to fail first — reading the claim, not trusting it for auth.
 *
 * Returns the expiry as epoch milliseconds, or null if the token is missing,
 * malformed, or carries no `exp`.
 */
export const getTokenExpiryMs = (token) => {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    // JWTs use base64url: swap in the standard alphabet and restore padding
    // before the browser's own base64 decoder can read it.
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));

    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};
