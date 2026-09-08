import api, { unwrap } from './axiosInstance.js';

/** Public — the website reads the grid with no session. */
export const list = () => api.get('/gallery').then(unwrap);

/** Admin — includes hidden rows. */
export const listAll = () => api.get('/gallery/all').then(unwrap);

/**
 * Admin — upload one image.
 *
 * Sent as multipart because it carries a file. The Content-Type header is
 * deliberately NOT set: the browser has to add its own multipart boundary, and
 * overriding it with the instance's `application/json` default would make the
 * body unparseable.
 */
export const upload = ({ file, title, caption }) => {
  const form = new FormData();
  form.append('image', file);
  if (title) form.append('title', title);
  if (caption) form.append('caption', caption);

  return api.post('/gallery', form, { headers: { 'Content-Type': undefined } }).then(unwrap);
};

export const update = (id, patch) => api.patch(`/gallery/${id}`, patch).then(unwrap);

export const remove = (id) => api.delete(`/gallery/${id}`).then(unwrap);

/** Send the full ordered list of ids. */
export const reorder = (ids) => api.put('/gallery/reorder', { ids }).then(unwrap);
