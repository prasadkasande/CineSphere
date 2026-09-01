import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorMessage from '../../components/ErrorMessage';
import ShowScheduler from '../../components/ShowScheduler';
import { TableSkeleton } from '../../components/Skeleton';
import {
  getMyShows,
  getMyTheatres,
  getSchedulableMovies,
  getUnfeaturedMovies,
} from '../../api/owner';
import { Pagination, usePagination } from '../../components/Pagination';
import SeriesDialog from '../../components/SeriesDialog';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import './OwnerShowsTab.css';

function formatDay(value) {
  return new Date(value).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** "Fri 4 Sep – Sun 13 Sep" for a run; a single date when it's all one day. */
function formatRange(first, last) {
  const opts = { weekday: 'short', month: 'short', day: 'numeric' };
  const a = new Date(first.showDateTime).toLocaleDateString([], opts);
  const b = new Date(last.showDateTime).toLocaleDateString([], opts);
  return a === b ? a : `${a} – ${b}`;
}

function formatWhen(value) {
  return new Date(value).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OwnerShowsTab({ initialMovieId = null }) {
  const toast = useToast();
  const formRef = useRef(null);

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [myShows, setMyShows] = useState([]);
  const [unfeatured, setUnfeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [preselectedMovieId, setPreselectedMovieId] = useState(initialMovieId);
  const [seriesDetail, setSeriesDetail] = useState(null);

  function refreshShows() {
    return Promise.all([getMyShows(), getUnfeaturedMovies()]).then(([shows, gaps]) => {
      setMyShows(shows);
      setUnfeatured(gaps);
    });
  }

  useEffect(() => {
    Promise.all([getSchedulableMovies(), getMyTheatres(), getMyShows(), getUnfeaturedMovies()])
      .then(([movieData, theatreData, showData, gapData]) => {
        setMovies(movieData);
        setTheatres(theatreData);
        setMyShows(showData);
        setUnfeatured(gapData);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up = [];
    const old = [];
    for (const s of myShows) {
      // A show retires the moment it starts - the expiry job flips it to
      // COMPLETED, and until it next runs the clock says the same thing.
      const live = s.status === 'SCHEDULED' && new Date(s.showDateTime).getTime() >= now;
      (live ? up : old).push(s);
    }
    up.sort((a, b) => new Date(a.showDateTime) - new Date(b.showDateTime));
    old.sort((a, b) => new Date(b.showDateTime) - new Date(a.showDateTime));
    return { upcoming: up, past: old };
  }, [myShows]);

  /**
   * Collapses each recurring run into a single entry. `upcoming` is already in
   * date order, so a series lands at the position of its first screening and
   * its children stay chronological.
   */
  const entries = useMemo(() => {
    const out = [];
    const bySeries = new Map();
    for (const show of upcoming) {
      if (!show.seriesId) {
        out.push({ key: `s${show.id}`, type: 'single', show });
        continue;
      }
      let group = bySeries.get(show.seriesId);
      if (!group) {
        group = { key: `g${show.seriesId}`, type: 'series', shows: [] };
        bySeries.set(show.seriesId, group);
        out.push(group);
      }
      group.shows.push(show);
    }
    return out;
  }, [upcoming]);

  const pagedEntries = usePagination(entries, 9);

  /** Preselect a movie in the scheduler and bring it into view. */
  function scheduleThis(movie) {
    setPreselectedMovieId(movie.id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast.info(`"${movie.title}" selected — pick a screen and time.`);
  }

  if (loading) return <TableSkeleton rows={4} />;

  const approvedTheatres = theatres.filter((t) => t.approved);

  return (
    <div>
      <ErrorMessage message={error} />

      {/* ---- Schedule a show: its own full-width section ---- */}
      <section className="section" ref={formRef}>
        <div className="section-head">
          <h2>Schedule a show</h2>
          <span className="muted section-count">One-off screening or a recurring run</span>
        </div>
        <ShowScheduler
          movies={movies}
          theatres={approvedTheatres}
          preselectedMovieId={preselectedMovieId}
          onScheduled={refreshShows}
        />
      </section>

      {/* ---- Upcoming ---- */}
      <section className="section">
        <div className="section-head">
          <h2>Upcoming shows</h2>
          <span className="badge badge-muted">{upcoming.length}</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="empty-state">No upcoming shows scheduled yet.</div>
        ) : (
          <>
            <div className="show-grid">
              {pagedEntries.slice.map((entry) => {
                if (entry.type === 'single') {
                  const s = entry.show;
                  return (
                    <article key={entry.key} className="card show-card">
                      <div className="show-card-when">
                        <span className="show-card-day">{formatDay(s.showDateTime)}</span>
                        <span className="show-card-time">{formatTime(s.showDateTime)}</span>
                      </div>
                      <div className="show-card-body">
                        <strong className="show-card-title">{s.movieTitle}</strong>
                        <span className="muted show-card-where">
                          {s.theatreName} · {s.screenName}
                        </span>
                      </div>
                      <Link className="btn btn-secondary btn-sm" to={`/owner/shows/${s.id}/bookings`}>
                        Bookings
                      </Link>
                    </article>
                  );
                }

                const [first] = entry.shows;
                const last = entry.shows[entry.shows.length - 1];
                const days = new Set(entry.shows.map((x) => x.showDateTime.slice(0, 10))).size;

                return (
                  <article key={entry.key} className="card show-card is-series">
                    <div className="show-card-when">
                      <span className="show-card-count">{entry.shows.length}</span>
                      <span className="show-card-count-label">shows</span>
                    </div>
                    <div className="show-card-body">
                      <strong className="show-card-title">
                        {first.movieTitle}
                        <span className="badge badge-muted series-tag">series</span>
                      </strong>
                      <span className="muted show-card-where">
                        {first.theatreName} · {first.screenName}
                      </span>
                      <span className="show-card-range">
                        {formatRange(first, last)} · {days} {days === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSeriesDetail(entry)}
                    >
                      View all
                    </button>
                  </article>
                );
              })}
            </div>

            <Pagination state={pagedEntries} noun="entries" />
          </>
        )}
      </section>

      {/* ---- Not yet featured ---- */}
      <section className="section">
        <div className="section-head">
          <h2>Not yet featured</h2>
          <span className="badge badge-muted">{unfeatured.length}</span>
        </div>
        <p className="muted gap-hint">
          Movies available on CineSphere that you haven't scheduled at any of your theatres.
        </p>

        {unfeatured.length === 0 ? (
          <div className="empty-state">You've scheduled every available movie.</div>
        ) : (
          <div className="gap-list stagger">
            {unfeatured.map((m) => (
              <div key={m.id} className="gap-card card card-hover">
                <div
                  className="gap-thumb"
                  style={{ backgroundImage: `url(${m.coverImageUrl})` }}
                  aria-hidden="true"
                />
                <div className="gap-info">
                  <strong>{m.title}</strong>
                  <p className="muted">
                    {[m.genre, m.language, m.durationMins && `${m.durationMins} min`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <span className={`badge ${m.status === 'UPCOMING' ? 'badge-warning' : 'badge-muted'}`}>
                    {m.status.replace('_', ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => scheduleThis(m)}
                  disabled={approvedTheatres.length === 0}
                >
                  Schedule
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Past ---- */}
      {past.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Past shows</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPast((v) => !v)}>
              {showPast ? 'Hide' : `Show ${past.length}`}
            </button>
          </div>

          {showPast && (
            <div className="table-scroll past-table animate-in">
              <table>
                <thead>
                  <tr>
                    <th>Movie</th>
                    <th>Theatre / Screen</th>
                    <th>When</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {past.map((s) => (
                    <tr key={s.id}>
                      <td className="cell-lead">{s.movieTitle}</td>
                      <td className="muted" data-label="Where">{s.theatreName} / {s.screenName}</td>
                      <td className="muted" data-label="When">{formatWhen(s.showDateTime)}</td>
                      <td className="cell-actions">
                        <Link className="btn btn-secondary btn-sm" to={`/owner/shows/${s.id}/bookings`}>
                          Bookings
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      <SeriesDialog
        open={Boolean(seriesDetail)}
        series={seriesDetail}
        onClose={() => setSeriesDetail(null)}
      />

    </div>
  );
}
