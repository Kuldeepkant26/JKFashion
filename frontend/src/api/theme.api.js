import api, { unwrap } from './axiosInstance.js';

/**
 * Public — the website reads this with no session.
 * Returns { themeId, fontId, hiddenThemeIds, updatedAt }.
 */
export const get = () => api.get('/theme').then(unwrap);

/**
 * Owner-only; the API rejects anyone but MAIN_ADMIN.
 *
 * Takes a partial patch — `{ themeId }`, `{ fontId }`, `{ hiddenThemeIds }` or
 * any combination. Anything omitted is left as it is on the server, so the
 * settings page can save one section without resending the others.
 */
export const update = (patch) => api.put('/theme', patch).then(unwrap);
