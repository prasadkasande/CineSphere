import client from './client';

function toFormData({ title, description, genre, language, durationMins, censorRating, status, coverImage }) {
  const formData = new FormData();
  formData.append('title', title);
  if (description) formData.append('description', description);
  if (genre) formData.append('genre', genre);
  if (language) formData.append('language', language);
  if (durationMins) formData.append('durationMins', durationMins);
  if (censorRating) formData.append('censorRating', censorRating);
  formData.append('status', status);
  if (coverImage) formData.append('coverImage', coverImage);
  return formData;
}

// axios detects FormData automatically and sets the multipart boundary itself.
export function createMovie(data) {
  return client.post('/creator/movies', toFormData(data)).then((r) => r.data);
}

export function updateMovie(id, data) {
  return client.put(`/creator/movies/${id}`, toFormData(data)).then((r) => r.data);
}

/** Puts a rejected title back in the admin queue. */
export function resubmitMovie(id) {
  return client.put(`/creator/movies/${id}/resubmit`).then((r) => r.data);
}

export function deleteMovie(id) {
  return client.delete(`/creator/movies/${id}`).then((r) => r.data);
}

export function getMyMovies() {
  return client.get('/creator/movies').then((r) => r.data);
}

export function getCreatorStats() {
  return client.get('/creator/stats').then((r) => r.data);
}
