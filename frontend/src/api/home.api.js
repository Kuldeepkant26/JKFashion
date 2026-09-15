import api, { unwrap } from './axiosInstance.js';

/** The hero content. Public — the website reads it with no session. */
export const get = () => api.get('/home').then(unwrap);

/** Admin — save the hero's text fields. The patch is nested: { hero }. */
export const updateSection = (patch) => api.patch('/home', patch).then(unwrap);

/*
 * Uploads are multipart because they carry a file. The Content-Type header is
 * deliberately NOT set: the browser has to add its own multipart boundary, and
 * overriding it with the instance's `application/json` default would make the
 * body unparseable.
 */
const multipart = { headers: { 'Content-Type': undefined } };

export const setHeroImage = (file) => {
  const form = new FormData();
  form.append('image', file);
  return api.put('/home/hero/image', form, multipart).then(unwrap);
};

export const clearHeroImage = () => api.delete('/home/hero/image').then(unwrap);
