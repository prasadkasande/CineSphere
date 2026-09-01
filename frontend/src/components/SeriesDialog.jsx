import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SeriesDialog.css';

function formatDay(value) {
  return new Date(value).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Every screening in one recurring run, in its own surface rather than
 * expanded inline.
 *
 * A fortnight's run injected fourteen rows into the middle of the schedule
 * table and pushed everything else off-screen - exactly the scrolling the
 * grouping was meant to remove. Here the run gets the whole panel, grouped by
 * day, and the table behind it keeps its shape.
 */
export default function SeriesDialog({ open, series, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !series) return null;

  const { shows } = series;
  const [first] = shows;

  // Several screenings a day is the normal shape of a run, so collapse the
  // repeated date and list that day's times together.
  const byDay = [];
  const index = new Map();
  for (const show of shows) {
    const day = show.showDateTime.slice(0, 10);
    if (!index.has(day)) {
      index.set(day, { day, shows: [] });
      byDay.push(index.get(day));
    }
    index.get(day).shows.push(show);
  }

  return (
    <div className="sd-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sd-panel" role="dialog" aria-modal="true" aria-labelledby="sd-title">
        <header className="sd-head">
          <div>
            <span className="badge badge-muted">Recurring run</span>
            <h3 id="sd-title">{first.movieTitle}</h3>
            <p className="muted">
              {first.theatreName} · {first.screenName}
            </p>
          </div>
          <button type="button" className="sd-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="sd-stats">
          <div>
            <strong>{shows.length}</strong>
            <span className="muted">screenings</span>
          </div>
          <div>
            <strong>{byDay.length}</strong>
            <span className="muted">{byDay.length === 1 ? 'day' : 'days'}</span>
          </div>
          <div>
            <strong>{formatDay(first.showDateTime)}</strong>
            <span className="muted">first</span>
          </div>
          <div>
            <strong>{formatDay(shows[shows.length - 1].showDateTime)}</strong>
            <span className="muted">last</span>
          </div>
        </div>

        <div className="sd-days">
          {byDay.map((entry) => (
            <div key={entry.day} className="sd-day">
              <span className="sd-day-label">{formatDay(entry.shows[0].showDateTime)}</span>
              <div className="sd-times">
                {entry.shows.map((show) => (
                  <Link key={show.id} to={`/owner/shows/${show.id}/bookings`} className="sd-time">
                    {formatTime(show.showDateTime)}
                    <em>Bookings</em>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
