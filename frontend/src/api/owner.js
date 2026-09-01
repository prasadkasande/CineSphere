import client from './client';

export function createTheatre(data) {
  return client.post('/owner/theatres', data).then((r) => r.data);
}

export function updateTheatre(id, data) {
  return client.put(`/owner/theatres/${id}`, data).then((r) => r.data);
}

export function getMyTheatres() {
  return client.get('/owner/theatres').then((r) => r.data);
}

/** Files a corrected application in place of a rejected one. */
export function resubmitTheatre(id, data) {
  return client.post(`/owner/theatres/${id}/resubmit`, data).then((r) => r.data);
}

export function getTheatreDeletionImpact(id) {
  return client.get(`/owner/theatres/${id}/deletion-impact`).then((r) => r.data);
}

export function deleteTheatre(id, note) {
  return client.delete(`/owner/theatres/${id}`, { data: { note } }).then((r) => r.data);
}

export function createScreen(data) {
  return client.post('/owner/screens', data).then((r) => r.data);
}

/** Full desired state: name + complete row layout. */
export function updateScreen(id, data) {
  return client.put(`/owner/screens/${id}`, data).then((r) => r.data);
}

export function getScreensByTheatre(theatreId) {
  return client.get('/owner/screens', { params: { theatreId } }).then((r) => r.data);
}

export function getScreenDeletionImpact(id) {
  return client.get(`/owner/screens/${id}/deletion-impact`).then((r) => r.data);
}

export function deleteScreen(id, note) {
  return client.delete(`/owner/screens/${id}`, { data: { note } }).then((r) => r.data);
}

export function createShow(data) {
  return client.post('/owner/shows', data).then((r) => r.data);
}

/** Dry run of a recurring plan - returns every slot it would fill, unsaved. */
export function previewRecurringShows(data) {
  return client.post('/owner/shows/recurring/preview', data).then((r) => r.data);
}

/** Commits a recurring plan; every free slot becomes a show in one series. */
export function createRecurringShows(data) {
  return client.post('/owner/shows/recurring', data).then((r) => r.data);
}

export function getMyShows() {
  return client.get('/owner/shows').then((r) => r.data);
}

export function getShowBookings(showId) {
  return client.get(`/owner/shows/${showId}/bookings`).then((r) => r.data);
}

export function getOwnerStats() {
  return client.get('/owner/stats').then((r) => r.data);
}

/** Approved, non-archived movies this owner can put on a screen. */
export function getSchedulableMovies() {
  return client.get('/owner/movies').then((r) => r.data);
}

/** Movies never scheduled at any of this owner's theatres. */
export function getUnfeaturedMovies() {
  return client.get('/owner/movies/unfeatured').then((r) => r.data);
}
