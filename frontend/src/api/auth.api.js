import api, { unwrap } from './axiosInstance.js';

export const login = (payload) => api.post('/auth/login', payload).then(unwrap);
export const logout = () => api.post('/auth/logout').then(unwrap);
export const refresh = () => api.post('/auth/refresh').then(unwrap);
export const me = () => api.get('/auth/me').then(unwrap);
