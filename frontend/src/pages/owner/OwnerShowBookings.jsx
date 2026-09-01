import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TableSkeleton } from '../../components/Skeleton';
import ErrorMessage from '../../components/ErrorMessage';
import { getShowBookings } from '../../api/owner';
import { apiErrorMessage } from '../../api/client';

export default function OwnerShowBookings() {
  const { id } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getShowBookings(id)
      .then(setBookings)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <TableSkeleton />;

  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED');
  const revenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
  const seatsSold = confirmed.reduce((sum, b) => sum + b.seats.length, 0);

  return (
    <div className="container page">
      <Link to="/owner" className="muted">
        ← Back to dashboard
      </Link>
      <h1>Show Bookings</h1>
      <ErrorMessage message={error} />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="card">
          <div className="muted">Confirmed bookings</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{confirmed.length}</div>
        </div>
        <div className="card">
          <div className="muted">Seats sold</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{seatsSold}</div>
        </div>
        <div className="card">
          <div className="muted">Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>${revenue.toFixed(2)}</div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">No bookings for this show yet.</div>
      ) : (
        <div className="table-scroll"><table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Booked at</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="cell-lead">Booking #{b.id}</td>
                <td data-label="Seats">{b.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ') || '—'}</td>
                <td data-label="Amount">${b.totalAmount.toFixed(2)}</td>
                <td data-label="Status">
                  <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-success' : 'badge-danger'}`}>
                    {b.status}
                  </span>
                </td>
                <td data-label="Booked at">{new Date(b.bookingTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
