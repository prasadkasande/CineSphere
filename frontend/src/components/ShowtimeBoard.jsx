import { useMemo, useState } from 'react';
import './ShowtimeBoard.css';

/**
 * A movie's screenings, as a customer picks them: a day at a time.
 *
 * The list is deliberately short. A recurring run can be hundreds of
 * screenings, and the old page rendered every one of them in a single flat
 * wall of buttons - so the backend now returns only the next couple of days
 * and this board splits those across a day strip. Anything further out is a
 * decision the customer isn't making yet.
 */

const DAY_MS = 86400000;

/** Midnight-anchored day key, so two times on the same evening group together. */
function dayKey(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayLabel(key, todayKey) {
  const diff = Math.round((key - todayKey) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return new Date(key).toLocaleDateString([], { weekday: 'long' });
}

function shortDate(key) {
  return new Date(key).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function time(value) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Cheapest tier, which is what "from $12" on a showtime conventionally means. */
function priceFrom(show) {
  const values = Object.values(show.prices || {}).map(Number).filter((n) => !Number.isNaN(n));
  if (values.length === 0) return null;
  const low = Math.min(...values);
  return `$${Number.isInteger(low) ? low : low.toFixed(2)}`;
}

export default function ShowtimeBoard({ shows, windowDays, nextShowAfterWindow, onPick }) {
  const [city, setCity] = useState('');
  const [day, setDay] = useState(null);

  /*
   * Cities come from the shows themselves rather than a text box: the filter
   * used to be free text matched exactly on the backend, so "Spring" instead
   * of "Springfield" silently returned nothing. Every option here is
   * guaranteed to have at least one screening behind it.
   */
  const cities = useMemo(
    () => [...new Set(shows.map((s) => s.city))].sort((a, b) => a.localeCompare(b)),
    [shows],
  );

  const inCity = useMemo(
    () => (city ? shows.filter((s) => s.city === city) : shows),
    [shows, city],
  );

  // Days are derived after the city filter, so a day that empties out when you
  // switch city disappears from the strip instead of showing an empty board.
  const days = useMemo(() => {
    const groups = new Map();
    for (const s of inCity) {
      const key = dayKey(new Date(s.showDateTime));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [inCity]);

  const todayKey = dayKey(new Date());
  // The selected day may vanish on a city change; fall back to the first one.
  const activeDay = days.some(([k]) => k === day) ? day : days[0]?.[0];
  const daysShows = days.find(([k]) => k === activeDay)?.[1] ?? [];

  const venues = useMemo(() => {
    const groups = new Map();
    for (const s of daysShows) {
      const key = s.theatreId;
      if (!groups.has(key)) groups.set(key, { name: s.theatreName, city: s.city, slots: [] });
      groups.get(key).slots.push(s);
    }
    return [...groups.values()];
  }, [daysShows]);

  if (shows.length === 0) {
    return (
      <div className="empty-state">
        {nextShowAfterWindow ? (
          <>
            <strong>Nothing in the next {windowDays} days.</strong>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              This film next plays{' '}
              {new Date(nextShowAfterWindow).toLocaleDateString([], {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              . Check back closer to the date.
            </p>
          </>
        ) : (
          'No upcoming shows for this movie yet.'
        )}
      </div>
    );
  }

  return (
    <div className="showtime-board">
      <div className="showtime-controls">
        <div className="day-strip" role="tablist" aria-label="Show day">
          {days.map(([key, list]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === activeDay}
              className={`day-pill ${key === activeDay ? 'is-on' : ''}`}
              onClick={() => setDay(key)}
            >
              <span className="day-pill-name">{dayLabel(key, todayKey)}</span>
              <span className="day-pill-date">{shortDate(key)}</span>
              <span className="day-pill-count">{list.length}</span>
            </button>
          ))}
        </div>

        {cities.length > 1 && (
          <div className="field showtime-city">
            <label htmlFor="city-filter">City</label>
            <select id="city-filter" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <p className="showtime-window muted">
        Showing the next {windowDays} days · {inCity.length} screening
        {inCity.length === 1 ? '' : 's'}
        {city ? ` in ${city}` : ''}
      </p>

      {venues.map((venue) => (
        <div key={venue.name + venue.city} className="card venue-card">
          <div className="venue-head">
            <h3 className="venue-name">{venue.name}</h3>
            <span className="muted venue-city">{venue.city}</span>
          </div>

          <div className="slot-row">
            {venue.slots.map((s) => {
              const from = priceFrom(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  className="slot"
                  onClick={() => onPick(s.id)}
                  aria-label={`${time(s.showDateTime)} at ${venue.name}, ${s.screenName}`}
                >
                  <span className="slot-time">{time(s.showDateTime)}</span>
                  <span className="slot-meta">
                    {s.screenName}
                    {from && <> · from {from}</>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
