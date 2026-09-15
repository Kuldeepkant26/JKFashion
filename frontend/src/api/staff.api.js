import api, { unwrap } from './axiosInstance.js';

/** Owner-only throughout; the API rejects anyone but MAIN_ADMIN. */

/** Resolves to { items: [...] }. */
export const list = () => api.get('/staff').then(unwrap);

export const create = (payload) => api.post('/staff', payload).then(unwrap);

/** Rename, activate/deactivate, or change which sections they can open. */
export const update = (id, patch) => api.patch(`/staff/${id}`, patch).then(unwrap);

/**
 * Set a password, or omit one to have the server generate a strong one.
 *
 * A generated password comes back as `generatedPassword` and is the only time
 * it is ever readable — stored passwords are bcrypt hashes, so nothing can
 * recover one later.
 */
export const setPassword = (id, password) =>
  api
    .post(`/staff/${id}/password`, password ? { password } : {})
    .then(unwrap);

export const remove = (id) => api.delete(`/staff/${id}`).then(unwrap);
