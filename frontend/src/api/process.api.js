import api, { unwrap } from './axiosInstance.js';

/** Public — the website reads the section with no session. */
export const get = () => api.get('/process').then(unwrap);

/** Admin — includes hidden rows. */
export const getAdmin = () => api.get('/process/admin').then(unwrap);

/** Admin — save the section's text fields. */
export const updateSection = (patch) => api.patch('/process', patch).then(unwrap);

/*
 * Uploads are multipart because they carry a file. The Content-Type header is
 * deliberately NOT set: the browser has to add its own multipart boundary, and
 * overriding it with the instance's `application/json` default would make the
 * body unparseable.
 */
const multipart = { headers: { 'Content-Type': undefined } };

/* ------------------------------------------------------------------ steps */

export const addStep = (payload) => api.post('/process/steps', payload).then(unwrap);

export const updateStep = (stepId, patch) =>
  api.patch(`/process/steps/${stepId}`, patch).then(unwrap);

export const deleteStep = (stepId) => api.delete(`/process/steps/${stepId}`).then(unwrap);

export const reorderSteps = (ids) =>
  api.put('/process/steps/reorder', { ids }).then(unwrap);

/* ------------------------------------------------------------------ video */

/**
 * Video uploads report progress: a 100MB file over a slow connection takes long
 * enough that a silent spinner reads as a hang.
 */
export const setVideo = (file, onProgress) => {
  const form = new FormData();
  form.append('video', file);

  return api
    .put('/process/video', form, {
      ...multipart,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    })
    .then(unwrap);
};

export const clearVideo = () => api.delete('/process/video').then(unwrap);

export const setVideoPoster = (file) => {
  const form = new FormData();
  form.append('image', file);
  return api.put('/process/video/poster', form, multipart).then(unwrap);
};

/* --------------------------------------------------------------- facility */

export const addFacilityPhoto = (file, caption) => {
  const form = new FormData();
  form.append('image', file);
  if (caption) form.append('caption', caption);
  return api.post('/process/facility', form, multipart).then(unwrap);
};

export const updateFacilityPhoto = (photoId, patch) =>
  api.patch(`/process/facility/${photoId}`, patch).then(unwrap);

export const deleteFacilityPhoto = (photoId) =>
  api.delete(`/process/facility/${photoId}`).then(unwrap);

export const reorderFacilityPhotos = (ids) =>
  api.put('/process/facility/reorder', { ids }).then(unwrap);
