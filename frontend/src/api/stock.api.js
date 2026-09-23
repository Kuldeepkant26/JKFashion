import api, { unwrap } from './axiosInstance.js';

/**
 * The daily materials ledger. Every endpoint needs a session and the STOCK
 * permission; deletes additionally require the owner, and the API — not this
 * file — is what enforces that.
 */

/* -------------------------------------------------------------------- items */

/** Resolves to { items, categories } — the config ships with the list. */
export const listItems = (params) => api.get('/stock/items', { params }).then(unwrap);

export const createItem = (payload) => api.post('/stock/items', payload).then(unwrap);

export const updateItem = (id, patch) => api.patch(`/stock/items/${id}`, patch).then(unwrap);

/** Record a counted figure; the difference is written as a correction entry. */
export const setBalance = (id, balance, note) =>
  api.post(`/stock/items/${id}/balance`, { balance, note }).then(unwrap);

/** Owner-only. Archives instead of deleting once the item has history. */
export const archiveItem = (id) => api.delete(`/stock/items/${id}`).then(unwrap);

export const restoreItem = (id) => api.post(`/stock/items/${id}/restore`).then(unwrap);

/* ---------------------------------------------------------------- movements */

/** Resolves to { items, total, page, limit, pages }. */
export const listMovements = (params) =>
  api.get('/stock/movements', { params }).then(unwrap);

/**
 * Record one movement. Resolves to { movement, item, warning } — `warning` is
 * set when the entry leaves the item short, and the entry is saved regardless.
 */
export const createMovement = (payload) =>
  api.post('/stock/movements', payload).then(unwrap);

/** An edit is a reversal plus a replacement; nothing is rewritten. */
export const editMovement = (id, payload) =>
  api.patch(`/stock/movements/${id}`, payload).then(unwrap);

/** Undo, leaving both the original and the reversal in the ledger. */
export const reverseMovement = (id) =>
  api.post(`/stock/movements/${id}/reverse`).then(unwrap);

/* ----------------------------------------------------------------- expenses */

/** Resolves to { items, total, page, limit, pages, totals }. */
export const listExpenses = (params) => api.get('/stock/expenses', { params }).then(unwrap);

/** `amount` is in rupees; the API converts it to paise. */
export const createExpense = (payload) => api.post('/stock/expenses', payload).then(unwrap);

export const updateExpense = (id, patch) =>
  api.patch(`/stock/expenses/${id}`, patch).then(unwrap);

/** Owner-only. */
export const deleteExpense = (id) => api.delete(`/stock/expenses/${id}`).then(unwrap);

/* ------------------------------------------------------- report and summary */

/** Everything recorded on one date: movements plus expenses. */
export const getReport = (date) => api.get('/stock/report', { params: { date } }).then(unwrap);

export const getSummary = () => api.get('/stock/summary').then(unwrap);
