import client from './client';

export function createBooking(showId, seatIds) {
  return client.post('/bookings', { showId, seatIds }).then((r) => r.data);
}

export function getMyBookings() {
  return client.get('/bookings/me').then((r) => r.data);
}

export function cancelBooking(id) {
  return client.post(`/bookings/${id}/cancel`).then((r) => r.data);
}

/** Refunds issued to the signed-in customer (tickets voided by an admin removal). */
export function getMyRefunds() {
  return client.get('/refunds/me').then((r) => r.data);
}
