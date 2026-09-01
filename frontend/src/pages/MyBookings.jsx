import { useEffect, useState } from 'react';
import { TableSkeleton } from '../components/Skeleton';
import ErrorMessage from '../components/ErrorMessage';
import BackLink from '../components/BackLink';
import PageHeader from '../components/PageHeader';
import ConfirmButton from '../components/ConfirmButton';
import { getMyBookings, cancelBooking, getMyRefunds } from '../api/bookings';
import { apiErrorMessage } from '../api/client';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    Promise.all([getMyBookings(), getMyRefunds()])
      .then(([b, r]) => {
        setBookings(b);
        setRefunds(r);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCancel(id) {
    setError('');
    try {
      await cancelBooking(id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (loading) return <TableSkeleton />;

  return (
    <div className="container page">
      <BackLink to="/" label="All movies" />
      <PageHeader
        title="My Bookings"
        subtitle="Every ticket you've booked, and anything that's been refunded."
      />
      <ErrorMessage message={error} />

      {bookings.length === 0 ? (
        <div className="empty-state">You haven't booked any shows yet.</div>
      ) : (
        <div className="grid" style={{ gap: 16 }}>
          {bookings.map((b) => {
            const isPast = new Date(b.showDateTime) < new Date();
            return (
              <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{b.movieTitle}</h3>
                  <p className="muted" style={{ margin: '0 0 4px' }}>
                    {b.theatreName} · {b.screenName}
                  </p>
                  <p className="muted" style={{ margin: '0 0 4px' }}>
                    {new Date(b.showDateTime).toLocaleString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p style={{ margin: 0 }}>
                    Seats: {b.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ') || '—'} · $
                    {b.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                  <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-success' : 'badge-danger'}`}>
                    {b.status}
                  </span>
                  {b.status === 'CONFIRMED' && !isPast && (
                    <ConfirmButton busyLabel="Cancelling…" onConfirm={() => handleCancel(b.id)} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {refunds.length > 0 && (
        <section className="section refunds-section">
          <div className="section-head">
            <h2>Refunds</h2>
            <span className="badge badge-muted">{refunds.length}</span>
          </div>
          <p className="muted" style={{ marginTop: -6, marginBottom: 14, fontSize: 13 }}>
            These bookings were cancelled because the movie or theatre was removed from CineSphere.
            The amount has been returned to your original payment method.
          </p>

          <div className="grid" style={{ gap: 12 }}>
            {refunds.map((r) => (
              <div key={r.id} className="card refund-card">
                <div>
                  <strong>{r.movieTitle}</strong>
                  <p className="muted" style={{ margin: '3px 0 0', fontSize: 13 }}>
                    {[r.theatreName, r.seats && `Seats ${r.seats}`].filter(Boolean).join(' · ')}
                  </p>
                  {r.note && <p className="dim" style={{ margin: '5px 0 0', fontSize: 12.5 }}>{r.note}</p>}
                  <p className="dim" style={{ margin: '5px 0 0', fontSize: 12 }}>
                    Refunded {new Date(r.refundedAt).toLocaleDateString()} · ref {r.paymentReference}
                  </p>
                </div>
                <div className="refund-amount">
                  <span className="badge badge-success">Refunded</span>
                  <strong>${Number(r.amount).toFixed(2)}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
