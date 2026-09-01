import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../api/bookings';
import './NextShowBanner.css';

function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || '';
}

/**
 * Greets a signed-in customer and, if they have a ticket coming up, reminds
 * them of it before they browse for another one - the thing a booking site
 * should surface first when you already hold a ticket.
 *
 * Silent for signed-out visitors, for staff roles (their dashboards are the
 * relevant landing place), and when nothing is upcoming.
 */
export default function NextShowBanner() {
  const { user } = useAuth();
  const [next, setNext] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') return;
    let cancelled = false;

    getMyBookings()
      .then((bookings) => {
        if (cancelled) return;
        const now = Date.now();
        const upcoming = bookings
          .filter((b) => b.status === 'CONFIRMED' && new Date(b.showDateTime).getTime() > now)
          .sort((a, b) => new Date(a.showDateTime) - new Date(b.showDateTime));
        setNext(upcoming[0] || null);
      })
      // A failure here must never block browsing - the banner just stays hidden.
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || user.role !== 'CUSTOMER') return null;

  return (
    <div className="next-show">
      <div className="next-show-greeting">
        <strong>Welcome back, {firstName(user.name)}.</strong>
        <span className="muted">
          {next ? 'You already have a ticket coming up.' : 'Pick something to watch.'}
        </span>
      </div>

      {next && (
        <Link to="/my-bookings" className="next-show-ticket">
          <span className="next-show-when">{describeWhen(next.showDateTime)}</span>
          <span className="next-show-movie">{next.movieTitle}</span>
          <span className="next-show-where muted">
            {next.theatreName} · {next.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ')}
          </span>
        </Link>
      )}
    </div>
  );
}

/** "Tonight at 19:00" reads better than a bare date when it's imminent. */
function describeWhen(iso) {
  const when = new Date(iso);
  const time = when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((when - startOfToday) / 86_400_000);

  if (days === 0) return `Today at ${time}`;
  if (days === 1) return `Tomorrow at ${time}`;
  if (days < 7) return `${when.toLocaleDateString([], { weekday: 'long' })} at ${time}`;
  return `${when.toLocaleDateString([], { day: 'numeric', month: 'short' })} at ${time}`;
}
