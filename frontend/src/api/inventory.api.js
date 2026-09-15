import api, { unwrap } from './axiosInstance.js';

/**
 * Production tracking. Every endpoint needs a session; deletes additionally
 * require the owner, and the API — not this file — is what enforces that.
 */

/* ---------------------------------------------------------- companies */

/** Resolves to { items, total, page, limit, pages }; items carry orderCount. */
export const listCompanies = (params) =>
  api.get('/inventory/companies', { params }).then(unwrap);

export const getCompany = (id) => api.get(`/inventory/companies/${id}`).then(unwrap);

export const createCompany = (payload) =>
  api.post('/inventory/companies', payload).then(unwrap);

export const updateCompany = (id, patch) =>
  api.patch(`/inventory/companies/${id}`, patch).then(unwrap);

/** Owner-only. Refused with 409 if the company still has orders. */
export const deleteCompany = (id) =>
  api.delete(`/inventory/companies/${id}`).then(unwrap);

/* -------------------------------------------------------------- orders */

/**
 * Resolves to { items, total, page, limit, pages, statusCounts }.
 * Items exclude the production log — only `getOrder` returns that.
 */
export const listOrders = (params) => api.get('/inventory/orders', { params }).then(unwrap);

/** One order, with its full log newest first. */
export const getOrder = (id) => api.get(`/inventory/orders/${id}`).then(unwrap);

/*
 * Creating an order is multipart because it may carry a design image. The
 * Content-Type header is deliberately NOT set: the browser has to add its own
 * multipart boundary, and overriding it with the instance's application/json
 * default would make the body unparseable.
 */
const multipart = { headers: { 'Content-Type': undefined } };

const toFormData = (payload, file) => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, value);
  });
  if (file) form.append('image', file);
  return form;
};

export const createOrder = (payload, file) =>
  api.post('/inventory/orders', toFormData(payload, file), multipart).then(unwrap);

export const updateOrder = (id, patch) =>
  api.patch(`/inventory/orders/${id}`, patch).then(unwrap);

export const setOrderStatus = (id, status) =>
  api.patch(`/inventory/orders/${id}/status`, { status }).then(unwrap);

/** Metres may be negative — that is how a mistyped figure is corrected. */
export const logProduction = (id, payload) =>
  api.post(`/inventory/orders/${id}/log`, payload).then(unwrap);

/** Owner-only. */
export const deleteLogEntry = (id, entryId) =>
  api.delete(`/inventory/orders/${id}/log/${entryId}`).then(unwrap);

export const setOrderImage = (id, file) => {
  const form = new FormData();
  form.append('image', file);
  return api.put(`/inventory/orders/${id}/image`, form, multipart).then(unwrap);
};

export const clearOrderImage = (id) =>
  api.delete(`/inventory/orders/${id}/image`).then(unwrap);

/** Owner-only. */
export const deleteOrder = (id) => api.delete(`/inventory/orders/${id}`).then(unwrap);

/** The dashboard figures. */
export const getSummary = () => api.get('/inventory/summary').then(unwrap);
