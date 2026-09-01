import { Link, useLocation } from 'react-router-dom';
import './Checkout.css';

export default function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="container page">
        <div className="empty-state">
          No booking to show. <Link to="/my-bookings">View your bookings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="alert alert-success" style={{ marginBottom: 20 }}>
        Booking confirmed! 🎉
      </div>

      <div className="grid split-layout">
        <div className="card">
          <h2 className="ticket-movie">{booking.movieTitle}</h2>
          <p className="ticket-meta">
            {booking.theatreName} · {booking.screenName}
          </p>
          <p className="ticket-meta">
            {new Date(booking.showDateTime).toLocaleString([], {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          <div className="ticket-block">
            <strong className="ticket-label">
              {booking.seats.length} seat{booking.seats.length === 1 ? '' : 's'}
            </strong>
            <div className="seat-chips">
              {booking.seats.map((s) => (
                <span key={s.seatId} className="seat-chip">
                  {s.rowLabel}
                  {s.seatNumber}
                  <span>{s.seatType}</span>
                </span>
              ))}
            </div>
            <div className="booking-ref">Booking reference #{booking.id}</div>
          </div>
        </div>

        <div className="card">
          <strong className="ticket-label">Paid</strong>
          <div className="pay-total" style={{ borderTop: 0, paddingTop: 0 }}>
            <span className="pay-total-label">Total</span>
            <span className="pay-total-value">${booking.totalAmount.toFixed(2)}</span>
          </div>

          <Link to="/my-bookings" className="btn btn-block">
            View my bookings
          </Link>
          <Link to="/" className="btn btn-secondary btn-block" style={{ marginTop: 8 }}>
            Book another movie
          </Link>
        </div>
      </div>
    </div>
  );
}
