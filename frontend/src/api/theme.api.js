import api, { unwrap } from './axiosInstance.js';

/** Public — the website reads this with no session. */
export const get = () => api.get('/theme').then(unwrap);

/** Owner-only; the API rejects anyone but MAIN_ADMIN. */
export const update = (themeId) => api.put('/theme', { themeId }).then(unwrap);
