import api, { unwrap } from './axiosInstance.js';

export const stats = () => api.get('/admin/stats').then(unwrap);
