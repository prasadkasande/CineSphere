import { useMemo, useState } from 'react';
import ConfirmButton from '../../components/ConfirmButton';
import { resubmitMovie } from '../../api/creator';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const APPROVAL_BADGE = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
};

const APPROVAL_LABEL = {
  PENDING: 'Awaiting approval',
  APPROVED: 'Live',
  REJECTED: 'Needs changes',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'APPROVED', label: 'Live' },
  { key: 'PENDING', label: 'In review' },
  { key: 'REJECTED', label: 'Needs changes' },
];

export default function CreatorMoviesTab({ movies, onEdit, onDelete, onChanged, onPostFirst }) {
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const counts = useMemo(() => {
    const base = { all: movies.length, APPROVED: 0, PENDING: 0, REJECTED: 0 };
    for (const m of movies) base[m.approvalStatus] = (base[m.approvalStatus] || 0) + 1;
    return base;
  }, [movies]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return movies.filter((m) => {
      if (filter !== 'all' && m.approvalStatus !== filter) return false;
      if (!term) return true;
      return [m.title, m.genre, m.language].filter(Boolean).join(' ').toLowerCase().includes(term);
    });
  }, [movies, filter, search]);

  async function handleResubmit(movie) {
    setBusyId(movie.id);
    try {
      await resubmitMovie(movie.id);
      toast.success(`"${movie.title}" resubmitted for review.`);
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (movies.length === 0) {
    return (
      <div className="empty-state creator-empty">
        <span className="creator-empty-icon" aria-hidden="true">🎬</span>
        <strong>No movies yet</strong>
        <p className="muted">
          Post a title and, once an admin approves it, theatre owners can schedule shows against it.
        </p>
        <button type="button" className="btn" onClick={onPostFirst}>
          Post your first movie
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="creator-toolbar">
        <div className="creator-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`creator-filter ${filter === f.key ? 'is-on' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="creator-filter-count">{counts[f.key] || 0}</span>
            </button>
          ))}
        </div>
        <div className="search-box creator-search">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search your titles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search your movies"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">No titles match that filter.</div>
      ) : (
        <div className="creator-movie-grid">
          {visible.map((m) => (
            <article key={m.id} className="card creator-movie-card">
              <div
                className="creator-movie-poster"
                style={{ backgroundImage: `url(${m.coverImageUrl})` }}
                aria-hidden="true"
              />
              <div className="creator-movie-body">
                <div className="creator-movie-head">
                  <strong className="creator-movie-title">{m.title}</strong>
                  <span className={`badge ${APPROVAL_BADGE[m.approvalStatus] || 'badge-muted'}`}>
                    {APPROVAL_LABEL[m.approvalStatus] || m.approvalStatus}
                  </span>
                </div>

                <p className="muted creator-movie-meta">
                  {[m.genre, m.language, m.durationMins && `${m.durationMins} min`, m.censorRating]
                    .filter(Boolean)
                    .join(' · ')}
                </p>

                {m.approvalStatus === 'REJECTED' && m.rejectionReason && (
                  <div className="creator-reject-note">
                    <strong>Why it was sent back</strong>
                    <p>{m.rejectionReason}</p>
                  </div>
                )}

                <div className="creator-movie-foot">
                  <span className="badge badge-muted">{m.status.replace('_', ' ')}</span>
                  <div className="row-actions">
                    {m.approvalStatus === 'REJECTED' && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={busyId === m.id}
                        onClick={() => handleResubmit(m)}
                      >
                        {busyId === m.id ? 'Resubmitting…' : 'Resubmit'}
                      </button>
                    )}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(m)}>
                      Edit
                    </button>
                    <ConfirmButton label="Delete" onConfirm={() => onDelete(m.id)} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
