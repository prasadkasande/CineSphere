import { Link } from 'react-router-dom';
import './CatalogueContext.css';

/**
 * The same catalogue means something different depending on who is looking:
 * a customer is choosing what to watch, an owner is deciding what to
 * programme, an admin is moderating what is listed. This strip states the
 * role's stake in it and links to where they act on it.
 */
export default function CatalogueContext({ role, stats }) {
  if (role === 'THEATRE_OWNER') {
    const { unscheduled, total } = stats;
    return (
      <div className="cat-context is-owner">
        <div className="cat-context-body">
          <strong>Programming view</strong>
          <span className="muted">
            {unscheduled === 0
              ? `You've scheduled all ${total} available titles.`
              : `${unscheduled} of ${total} titles aren't scheduled at your theatres yet.`}
          </span>
        </div>
        <Link to="/owner" className="btn btn-sm">
          Open scheduler
        </Link>
      </div>
    );
  }

  if (role === 'ADMIN') {
    const { pending, noShowtimes, total } = stats;
    return (
      <div className="cat-context is-admin">
        <div className="cat-context-body">
          <strong>Moderation view</strong>
          <span className="muted">
            {total} {total === 1 ? 'title' : 'titles'} in the catalogue
            {pending > 0 && ` · ${pending} awaiting review`}
            {noShowtimes > 0 && ` · ${noShowtimes} approved with no showtimes`}
          </span>
        </div>
        <Link to="/admin" className="btn btn-sm">
          Review queue
        </Link>
      </div>
    );
  }

  return null;
}
