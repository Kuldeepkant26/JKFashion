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

/** Owner-only. Refused with 409 if the company still has orders or samples. */
export const deleteCompany = (id) =>
  api.delete(`/inventory/companies/${id}`).then(unwrap);

/** Resolves to { company, stats: { orders, metres, samples }, activity }. */
export const getCompanyOverview = (id) =>
  api.get(`/inventory/companies/${id}/overview`).then(unwrap);

/* Declared ahead of their first use below; `const` bindings are not hoisted. */
const multipart = { headers: { 'Content-Type': undefined } };

const imageForm = (file) => {
  const form = new FormData();
  form.append('image', file);
  return form;
};

/** The buyer's logo — set and removed only here, never by a design upload. */
export const setCompanyLogo = (id, file) =>
  api.put(`/inventory/companies/${id}/logo`, imageForm(file), multipart).then(unwrap);

export const clearCompanyLogo = (id) =>
  api.delete(`/inventory/companies/${id}/logo`).then(unwrap);

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
 * Content-Type header is deliberately NOT set (see `multipart` above): the
 * browser has to add its own multipart boundary, and overriding it with the
 * instance's application/json default would make the body unparseable.
 */

const toFormData = (payload, file) => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, value);
  });
  if (file) form.append('image', file);
  return form;
};

/**
 * Convert a sample into a production order. `payload.sampleId` is required —
 * there is no other way to raise one — and the buyer comes from the sample.
 */
export const createOrder = (payload, file) =>
  api.post('/inventory/orders', toFormData(payload, file), multipart).then(unwrap);

/**
 * Drop empty values from a patch.
 *
 * The form posts every field it holds, including '' for the ones left blank.
 * The API's validators skip empty strings, but the controller only skips
 * `undefined` — so an '' would reach the update and clear a field nobody
 * touched. Matching what `toFormData` already does on create keeps the two
 * paths honest with each other.
 */
const prune = (patch) =>
  Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

export const updateOrder = (id, patch) =>
  api.patch(`/inventory/orders/${id}`, prune(patch)).then(unwrap);

/**
 * The order number a new order for this buyer would get.
 * A preview — the number is claimed when the order is saved.
 */
export const previewOrderNumber = (companyId) =>
  api.get('/inventory/orders/next-number', { params: { companyId } }).then(unwrap);

export const setOrderStatus = (id, status) =>
  api.patch(`/inventory/orders/${id}/status`, { status }).then(unwrap);

/** Metres may be negative — that is how a mistyped figure is corrected. */
export const logProduction = (id, payload) =>
  api.post(`/inventory/orders/${id}/log`, payload).then(unwrap);

/** Owner-only. */
export const deleteLogEntry = (id, entryId) =>
  api.delete(`/inventory/orders/${id}/log/${entryId}`).then(unwrap);

export const setOrderImage = (id, file) =>
  api.put(`/inventory/orders/${id}/image`, imageForm(file), multipart).then(unwrap);

export const clearOrderImage = (id) =>
  api.delete(`/inventory/orders/${id}/image`).then(unwrap);

/** Owner-only. */
export const deleteOrder = (id) => api.delete(`/inventory/orders/${id}`).then(unwrap);

/** The dashboard figures. */
export const getSummary = () => api.get('/inventory/summary').then(unwrap);

/* ------------------------------------------------------------- samples */

/**
 * Resolves to { items, total, page, limit, pages, statusCounts }. `status` is
 * one status, or a group: SAMPLING (not yet converted) or OPEN (convertible).
 */
export const listSamples = (params) => api.get('/inventory/samples', { params }).then(unwrap);

/** One sample, with the order it was converted into (`order`), if any. */
export const getSample = (id) => api.get(`/inventory/samples/${id}`).then(unwrap);

export const createSample = (payload, file) =>
  api.post('/inventory/samples', toFormData(payload, file), multipart).then(unwrap);

export const updateSample = (id, patch) =>
  api.patch(`/inventory/samples/${id}`, prune(patch)).then(unwrap);

export const previewSampleNumber = (companyId) =>
  api.get('/inventory/samples/next-number', { params: { companyId } }).then(unwrap);

export const setSampleStatus = (id, status) =>
  api.patch(`/inventory/samples/${id}/status`, { status }).then(unwrap);

export const setSampleImage = (id, file) =>
  api.put(`/inventory/samples/${id}/image`, imageForm(file), multipart).then(unwrap);

export const clearSampleImage = (id) =>
  api.delete(`/inventory/samples/${id}/image`).then(unwrap);

/** Owner-only. Refused with 409 while orders point at the sample. */
export const deleteSample = (id) => api.delete(`/inventory/samples/${id}`).then(unwrap);
