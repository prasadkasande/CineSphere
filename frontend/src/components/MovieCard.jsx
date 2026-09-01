import { Link, useNavigate } from 'react-router-dom';
import './MovieCard.css';

/**
 * A catalogue poster. `overlay` and `action` let each role annotate the same
 * card - an owner needs to know whether they screen it, an admin whether it is
 * live - without the page having to fork into three different grids.
 */
export default function MovieCard({ movie, overlay, action }) {
  const navigate = useNavigate();

  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="movie-poster" style={{ backgroundImage: `url(${movie.coverImageUrl})` }}>
        {movie.status === 'UPCOMING' && <span className="badge badge-warning movie-badge">Upcoming</span>}
        {overlay && <span className={`badge ${overlay.tone} movie-badge movie-badge-role`}>{overlay.label}</span>}
      </div>

      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p className="muted">
          {[movie.genre, movie.language].filter(Boolean).join(' · ')}
        </p>

        {action && (
          <button
            type="button"
            className="btn btn-secondary btn-sm movie-action"
            onClick={(e) => {
              // The card itself is a link to the movie page; this is a
              // different destination, so stop it bubbling up.
              e.preventDefault();
              e.stopPropagation();
              navigate(action.to, action.state ? { state: action.state } : undefined);
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </Link>
  );
}
