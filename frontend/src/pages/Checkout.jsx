import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import BackLink from '../components/BackLink';
import { createBooking } from '../api/bookings';
import { apiErrorMessage } from '../api/client';
import './Checkout.css';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [secondsLeft, setSecondsLeft] = useState(() => (state ? secondsUntil(state.expiresAt) : 0));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state) return;
    const interval = setInterval(() => setSecondsLeft(secondsUntil(state.expiresAt)), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const total = useMemo(() => {
    if (!state) return 0;
    return state.seats.reduce((sum, s) => sum + s.price, 0);
  }, [state]);

  if (!state) {
    return (
      <div className="container page">
        <div className="empty-state">Nothing to check out. Pick seats from a movie's showtimes first.</div>
      </div>
    );
  }

  const expired = secondsLeft <= 0;

  async function handleConfirm() {
    setError('');
    setSubmitting(true);
    try {
      const booking = await createBooking(state.showId, state.seatIds);
      navigate('/booking-confirmation', { state: { booking } });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container page">
      <BackLink to={`/shows/${state.showId}/seats`} label="Change seats" />
      <h1 style={{ marginBottom: 20 }}>Confirm your booking</h1>

      <div className="grid split-layout">
        <div className="card">
          <h2 className="ticket-movie">{state.show.movieTitle}</h2>
          <p className="ticket-meta">
            {state.show.theatreName}
            {state.show.screenName ? ` · ${state.show.screenName}` : ''}
          </p>
          <p className="ticket-meta">
            {new Date(state.show.showDateTime).toLocaleString([], {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          <div className="ticket-block">
            <strong className="ticket-label">
              {state.seats.length} seat{state.seats.length === 1 ? '' : 's'}
            </strong>
            <div className="seat-chips">
              {state.seats.map((s) => (
                <span key={s.seatId} className="seat-chip">
                  {s.rowLabel}
                  {s.seatNumber}
                  <span>{s.seatType}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <strong className="ticket-label">Payment</strong>

          <div className="pay-lines">
            {state.seats.map((s) => (
              <div key={s.seatId} className="pay-line">
                <span>
                  {s.rowLabel}
                  {s.seatNumber} · {s.seatType}
                </span>
                <strong>${s.price.toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <div className="pay-total">
            <span className="pay-total-label">Total</span>
            <span className="pay-total-value">${total.toFixed(2)}</span>
          </div>

          {!expired ? (
            <div className={`alert ${secondsLeft <= 60 ? 'alert-error' : 'alert-success'}`}>
              Seats held for {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </div>
          ) : (
            <div className="alert alert-error">
              Your seat hold has expired. Go back and reselect your seats.
            </div>
          )}

          <ErrorMessage message={error} />

          <button className="btn btn-block" disabled={expired || submitting} onClick={handleConfirm}>
            {submitting ? 'Processing payment…' : 'Pay (mock) & Confirm'}
          </button>
          <p className="pay-note">Mock payment — no card details are collected or stored.</p>
        </div>
      </div>
    </div>
  );
}

function secondsUntil(isoString) {
  const diffMs = new Date(isoString).getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 1000));
}
