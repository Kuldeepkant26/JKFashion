import api, { unwrap } from './axiosInstance.js';

/** Owner-only throughout; the API rejects anyone but MAIN_ADMIN. */

/** Resolves to { items: [...] }. */
export const list = () => api.get('/staff').then(unwrap);

export const create = (payload) => api.post('/staff', payload).then(unwrap);

/** Rename, or activate/deactivate. */
export const update = (id, patch) => api.patch(`/staff/${id}`, patch).then(unwrap);

export const setPassword = (id, password) =>
  api.post(`/staff/${id}/password`, { password }).then(unwrap);

export const remove = (id) => api.delete(`/staff/${id}`).then(unwrap);
