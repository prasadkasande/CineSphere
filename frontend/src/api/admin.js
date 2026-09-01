import client from './client';

export function getAllTheatres() {
  return client.get('/admin/theatres').then((r) => r.data);
}

export function getPendingTheatres() {
  return client.get('/admin/theatres/pending').then((r) => r.data);
}

export function approveTheatre(id) {
  return client.post(`/admin/theatres/${id}/approve`).then((r) => r.data);
}

/** The reason is mandatory — the owner is shown it verbatim before purge. */
export function rejectTheatre(id, reason) {
  return client.post(`/admin/theatres/${id}/reject`, { reason }).then((r) => r.data);
}

export function deleteTheatre(id, note) {
  return client.delete(`/admin/theatres/${id}`, { data: { note } }).then((r) => r.data);
}

export function deleteUser(id, note) {
  return client.delete(`/admin/users/${id}`, { data: { note } }).then((r) => r.data);
}

/* Impact previews - what a delete would refund/destroy, shown before confirming. */

export function getMovieDeletionImpact(id) {
  return client.get(`/admin/movies/${id}/deletion-impact`).then((r) => r.data);
}

export function getTheatreDeletionImpact(id) {
  return client.get(`/admin/theatres/${id}/deletion-impact`).then((r) => r.data);
}

export function getUserDeletionImpact(id) {
  return client.get(`/admin/users/${id}/deletion-impact`).then((r) => r.data);
}

export function archiveMovie(id) {
  return client.put(`/admin/movies/${id}/archive`).then((r) => r.data);
}

export function deleteMovie(id, note) {
  return client.delete(`/admin/movies/${id}`, { data: { note } }).then((r) => r.data);
}

export function setMovieFeatured(id, featured) {
  const action = featured ? 'feature' : 'unfeature';
  return client.put(`/admin/movies/${id}/${action}`).then((r) => r.data);
}

/** Full catalogue for moderation - unlike the public list this is not filtered
 *  by show availability. */
export function getAllMoviesForAdmin() {
  return client.get('/admin/movies').then((r) => r.data);
}

export function getPendingMovies() {
  return client.get('/admin/movies/pending').then((r) => r.data);
}

export function approveMovie(id) {
  return client.put(`/admin/movies/${id}/approve`).then((r) => r.data);
}

/** The reason is mandatory — the creator is shown it verbatim. */
export function rejectMovie(id, reason) {
  return client.put(`/admin/movies/${id}/reject`, { reason }).then((r) => r.data);
}

export function getAdminStats() {
  return client.get('/admin/stats').then((r) => r.data);
}

export function getAllUsers() {
  return client.get('/admin/users').then((r) => r.data);
}

export function getPendingUsers() {
  return client.get('/admin/users/pending').then((r) => r.data);
}

export function approveUser(id) {
  return client.post(`/admin/users/${id}/approve`).then((r) => r.data);
}

export function rejectUser(id, reason) {
  return client.post(`/admin/users/${id}/reject`, { reason }).then((r) => r.data);
}

export function suspendUser(id) {
  return client.put(`/admin/users/${id}/suspend`).then((r) => r.data);
}

export function activateUser(id) {
  return client.put(`/admin/users/${id}/activate`).then((r) => r.data);
}
