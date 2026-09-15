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

/**
 * Owner-only. Who gets emailed when an enquiry arrives.
 * Resolves to { notifyEnabled, recipients, smtpConfigured, updatedAt }.
 */
export const getNotifySettings = () =>
  api.get('/enquiries/settings/notifications').then(unwrap);

/**
 * Owner-only. Takes a partial patch — `{ notifyEnabled }`, `{ recipients }` or
 * both. Anything omitted is left as it is on the server.
 */
export const updateNotifySettings = (patch) =>
  api.put('/enquiries/settings/notifications', patch).then(unwrap);

/**
 * Owner-only. Verifies the server's SMTP credentials without sending a real
 * message. Resolves to { ok, message }.
 */
export const testNotifyTransport = () =>
  api.post('/enquiries/settings/notifications/test').then(unwrap);
