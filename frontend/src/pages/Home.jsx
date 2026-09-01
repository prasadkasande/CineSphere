import { useEffect, useMemo, useState } from 'react';
import MovieCard from '../components/MovieCard';
import HeroRotator from '../components/HeroRotator';
import NextShowBanner from '../components/NextShowBanner';
import ErrorMessage from '../components/ErrorMessage';
import { MovieGridSkeleton } from '../components/Skeleton';
import CatalogueContext from '../components/CatalogueContext';
import { listMovies, getMovieFilters, getFeaturedMovies } from '../api/movies';
import { getSchedulableMovies, getUnfeaturedMovies } from '../api/owner';
import { getAllMoviesForAdmin } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import './Home.css';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'title', label: 'A–Z' },
  { value: 'duration', label: 'Runtime' },
];

export default function Home() {
  const { user } = useAuth();
  const role = user?.role;

  const [movies, setMovies] = useState([]);
  // Role-specific annotations for the same catalogue.
  const [ownerCatalogue, setOwnerCatalogue] = useState(null);
  const [adminMovies, setAdminMovies] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [facets, setFacets] = useState({ genres: [], languages: [] });
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMovieFilters().then(setFacets).catch(() => {});
    getFeaturedMovies().then(setFeatured).catch(() => {});
  }, []);

  // Staff annotations are additive - if the call fails the catalogue still
  // renders, just without the overlay.
  useEffect(() => {
    setOwnerCatalogue(null);
    setAdminMovies(null);

    if (role === 'THEATRE_OWNER') {
      // Both from the owner's own catalogue, so the counts share a denominator -
      // the public list only contains titles that already have showtimes, which
      // is a different population entirely.
      Promise.all([getSchedulableMovies(), getUnfeaturedMovies()])
        .then(([schedulable, unscheduled]) =>
          setOwnerCatalogue({
            total: schedulable.length,
            unscheduledIds: new Set(unscheduled.map((m) => m.id)),
          }),
        )
        .catch(() => {});
    } else if (role === 'ADMIN') {
      getAllMoviesForAdmin().then(setAdminMovies).catch(() => {});
    }
  }, [role]);

  /** Per-role badge and action for a catalogue card. */
  const annotate = useMemo(() => {
    if (role === 'THEATRE_OWNER' && ownerCatalogue) {
      return (movie) => {
        const unscheduled = ownerCatalogue.unscheduledIds.has(movie.id);
        return {
          overlay: unscheduled
            ? { label: 'Not scheduled', tone: 'badge-warning' }
            : { label: 'On your screens', tone: 'badge-success' },
          action: {
            label: unscheduled ? 'Schedule this' : 'Add another show',
            to: '/owner',
            state: { scheduleMovieId: movie.id },
          },
        };
      };
    }

    if (role === 'ADMIN' && adminMovies) {
      const byId = new Map(adminMovies.map((m) => [m.id, m]));
      return (movie) => {
        const record = byId.get(movie.id);
        if (!record) return {};
        return {
          overlay:
            record.upcomingShows > 0
              ? {
                  label: `${record.upcomingShows} showtime${record.upcomingShows === 1 ? '' : 's'}`,
                  tone: 'badge-muted',
                }
              : { label: 'No showtimes', tone: 'badge-warning' },
          action: { label: 'Moderate', to: '/admin' },
        };
      };
    }

    return () => ({});
  }, [role, ownerCatalogue, adminMovies]);

  const contextStats = useMemo(() => {
    if (role === 'THEATRE_OWNER' && ownerCatalogue) {
      return { unscheduled: ownerCatalogue.unscheduledIds.size, total: ownerCatalogue.total };
    }
    if (role === 'ADMIN' && adminMovies) {
      // All three come from the admin catalogue for the same reason.
      return {
        total: adminMovies.length,
        pending: adminMovies.filter((m) => m.approvalStatus === 'PENDING').length,
        noShowtimes: adminMovies.filter(
          (m) => m.approvalStatus === 'APPROVED' && m.upcomingShows === 0,
        ).length,
      };
    }
    return null;
  }, [role, ownerCatalogue, adminMovies]);

  // Debounce the search box so typing doesn't hammer the API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError('');
    listMovies({ search: debounced, genre, language, sort })
      .then(setMovies)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [debounced, genre, language, sort]);

  const filtering = Boolean(debounced || genre || language);

  const nowShowing = useMemo(() => movies.filter((m) => m.status === 'NOW_SHOWING'), [movies]);
  const upcoming = useMemo(() => movies.filter((m) => m.status === 'UPCOMING'), [movies]);

  const byGenre = useMemo(() => {
    const groups = {};
    for (const m of nowShowing) {
      if (!m.genre) continue;
      (groups[m.genre] = groups[m.genre] || []).push(m);
    }
    // Only worth its own row if there's more than one title in it.
    return Object.entries(groups).filter(([, list]) => list.length > 1);
  }, [nowShowing]);

  function clearFilters() {
    setSearch('');
    setGenre('');
    setLanguage('');
    setSort('newest');
  }

  return (
    <div className="home">
      {!filtering && featured.length > 0 && <HeroRotator movies={featured} />}

      <div className="container">
        {!filtering && <NextShowBanner />}
        {contextStats && <CatalogueContext role={role} stats={contextStats} />}

        <div className="filter-bar">
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search movies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search movies"
            />
          </div>

          <div className="filter-controls">
            <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Filter by genre">
              <option value="">All genres</option>
              {facets.genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Filter by language">
              <option value="">All languages</option>
              {facets.languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {filtering && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>

        <ErrorMessage message={error} />

        {loading ? (
          <MovieGridSkeleton count={8} />
        ) : movies.length === 0 ? (
          <div className="empty-state">
            No movies match {debounced ? `“${debounced}”` : 'those filters'}.
            <div style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          </div>
        ) : filtering ? (
          <section className="section">
            <div className="section-head">
              <h2>
                {movies.length} result{movies.length === 1 ? '' : 's'}
              </h2>
            </div>
            <div className="grid movie-grid stagger">
              {movies.map((m) => (
                <MovieCard key={m.id} movie={m} {...annotate(m)} />
              ))}
            </div>
          </section>
        ) : (
          <>
            {nowShowing.length > 0 && (
              <MovieSection title="Now Showing" movies={nowShowing} annotate={annotate} />
            )}
            {upcoming.length > 0 && (
              <MovieSection title="Coming Soon" movies={upcoming} annotate={annotate} />
            )}
            {byGenre.map(([g, list]) => (
              <MovieSection key={g} title={g} movies={list} annotate={annotate} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/** A titled row of posters that wraps onto further lines instead of scrolling. */
function MovieSection({ title, movies, annotate }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        <span className="muted section-count">{movies.length}</span>
      </div>
      <div className="grid movie-grid stagger">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} {...annotate(m)} />
        ))}
      </div>
    </section>
  );
}
