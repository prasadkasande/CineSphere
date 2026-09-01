import client from './client';

/**
 * Accepts either a bare status string (legacy callers) or an options object
 * with any of: status, search, genre, language, sort.
 */
export function listMovies(options) {
  const params = typeof options === 'string' ? { status: options } : { ...(options || {}) };
  // Drop empty values so the backend treats them as "no filter".
  Object.keys(params).forEach((k) => {
    if (params[k] === '' || params[k] == null) delete params[k];
  });
  return client.get('/movies', { params }).then((r) => r.data);
}

export function getMovieFilters() {
  return client.get('/movies/filters').then((r) => r.data);
}

/** Admin-curated hero rotation for the home page. */
export function getFeaturedMovies() {
  return client.get('/movies/featured').then((r) => r.data);
}

export function getMovie(id) {
  return client.get(`/movies/${id}`).then((r) => r.data);
}

/**
 * A movie's screenings, bounded to a window of days (the backend defaults to
 * 2 and caps at 14). Resolves to
 * `{ shows, windowDays, nextShowAfterWindow }` - the last is non-null only
 * when the window is empty but the film plays later on.
 */
export function getShowsForMovie(id, { days } = {}) {
  const params = days ? { days } : {};
  return client.get(`/movies/${id}/shows`, { params }).then((r) => r.data);
}
