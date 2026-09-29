import api, { unwrap } from './axiosInstance.js';

/**
 * The dashboard: headline figures, production over `range` days (7, 30 or
 * 90), where orders and samples stand, what is due, enquiries — and money and
 * stock for an account that can open that section.
 */
export const dashboard = (range = 30) =>
  api.get('/admin/dashboard', { params: { range } }).then(unwrap);
