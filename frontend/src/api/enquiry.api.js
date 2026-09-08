import api, { unwrap } from './axiosInstance.js';

/**
 * Public — the website's enquiry form posts here with no session.
 * Resolves to { id, createdAt }.
 */
export const create = (payload) => api.post('/enquiries', payload).then(unwrap);

/** Admin. Resolves to { items, total, page, limit, pages, newCount }. */
export const list = (params) => api.get('/enquiries', { params }).then(unwrap);

/** Admin — move an enquiry between NEW / READ / ARCHIVED. */
export const updateStatus = (id, status) =>
  api.patch(`/enquiries/${id}`, { status }).then(unwrap);

/** Owner-only; the API rejects anyone but MAIN_ADMIN. */
export const remove = (id) => api.delete(`/enquiries/${id}`).then(unwrap);
