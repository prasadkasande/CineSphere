import client from './client';

export function getShow(id) {
  return client.get(`/shows/${id}`).then((r) => r.data);
}

export function getSeatMap(showId) {
  return client.get(`/shows/${showId}/seats`).then((r) => r.data);
}

export function lockSeats(showId, seatIds) {
  return client.post(`/shows/${showId}/seats/lock`, { seatIds }).then((r) => r.data);
}
