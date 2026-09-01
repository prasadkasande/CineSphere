import { useEffect, useMemo, useState } from 'react';
import { TableSkeleton } from '../../components/Skeleton';
import ErrorMessage from '../../components/ErrorMessage';
import DeleteDialog from '../../components/DeleteDialog';
import ReasonDialog from '../../components/ReasonDialog';
import {
  approveMovie,
  archiveMovie,
  deleteMovie,
  getAllMoviesForAdmin,
  getMovieDeletionImpact,
  getPendingMovies,
  rejectMovie,
  setMovieFeatured,
} from '../../api/admin';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import './AdminMoviesTab.css';

export default function AdminMoviesTab() {
  const toast = useToast();
  const [movies, setMovies] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [target, setTarget] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [impact, setImpact] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [note, setNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState('');

  /** Load the refund/impact preview as the delete dialog opens. */
  function openDelete(movie) {
    setDialogError('');
    setNote('');
    setImpact(null);
    setTarget(movie);
    setImpactLoading(true);
    getMovieDeletionImpact(movie.id)
      .then(setImpact)
      .catch(() => {})
      .finally(() => setImpactLoading(false));
  }

  function load() {
    setLoading(true);
    Promise.all([getAllMoviesForAdmin(), getPendingMovies()])
      .then(([approved, awaiting]) => {
        setMovies(approved);
        setPending(awaiting);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const featured = useMemo(
    () => movies.filter((m) => m.featured).sort((a, b) => a.featuredOrder - b.featuredOrder),
    [movies]
  );

  async function runAction(id, fn, message) {
    setBusyId(id);
    setError('');
    try {
      await fn();
      load();
      toast.success(message);
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <TableSkeleton />;

  return (
    <div>
      {/* ---- review queue ---- */}
      <section className="section">
        <div className="section-head">
          <h2 style={{ marginTop: 0 }}>Awaiting approval</h2>
          <span className="badge badge-muted">{pending.length}</span>
        </div>
        <p className="muted review-hint">
          Movie Creators submit titles here. Until you approve one, it stays hidden from the public
          catalogue and theatre owners can't schedule it.
        </p>

        {pending.length === 0 ? (
          <div className="empty-state">No submissions waiting for review.</div>
        ) : (
          <div className="review-list stagger">
            {pending.map((m) => (
              <div className="review-card card" key={m.id}>
                <div
                  className="review-thumb"
                  style={{ backgroundImage: `url(${m.coverImageUrl})` }}
                  aria-hidden="true"
                />
                <div className="review-info">
                  <strong>{m.title}</strong>
                  <p className="muted review-meta">
                    {[m.genre, m.language, m.durationMins && `${m.durationMins} min`, m.censorRating]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {m.description && <p className="muted review-desc">{m.description}</p>}
                  <span className="dim review-by">Submitted by {m.creatorName}</span>
                </div>
                <div className="review-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={busyId === m.id}
                    onClick={() =>
                      runAction(m.id, () => approveMovie(m.id), `"${m.title}" approved and published.`)
                    }
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    disabled={busyId === m.id}
                    onClick={() => {
                      setRejectError('');
                      setRejectTarget(m);
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- hero rotation ---- */}
      <section className="section">
        <div className="featured-strip card">
          <div className="featured-strip-head">
            <strong>Homepage hero rotation</strong>
            <span className="muted">
              {featured.length === 0
                ? 'None selected — the hero falls back to the newest now-showing titles.'
                : `${featured.length} movie${featured.length === 1 ? '' : 's'} rotating`}
            </span>
          </div>

          {featured.length > 0 && (
            <div className="featured-chips stagger">
              {featured.map((m, i) => (
                <div className="featured-chip" key={m.id}>
                  <span className="featured-chip-order">{i + 1}</span>
                  <span
                    className="featured-chip-thumb"
                    style={{ backgroundImage: `url(${m.coverImageUrl})` }}
                    aria-hidden="true"
                  />
                  <span className="featured-chip-title">{m.title}</span>
                  <button
                    type="button"
                    className="featured-chip-remove"
                    disabled={busyId === m.id}
                    onClick={() =>
                      runAction(m.id, () => setMovieFeatured(m.id, false), `"${m.title}" removed from the hero.`)
                    }
                    aria-label={`Remove ${m.title} from hero`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- live catalogue ---- */}
      <section className="section">
        <h2>Live catalogue</h2>
        <ErrorMessage message={error} />

        {movies.length === 0 ? (
          <div className="empty-state">No movies in the catalogue yet.</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Genre</th>
                  <th>Posted by</th>
                  <th>Status</th>
                  <th>Hero</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m.id} className={m.featured ? 'is-featured' : ''}>
                    <td className="cell-lead"><strong>{m.title}</strong></td>
                    <td className="muted" data-label="Genre">{m.genre}</td>
                    <td className="muted" data-label="Posted by">{m.creatorName}</td>
                    <td data-label="Status">
                      <div className="status-cell">
                        <span className="badge badge-muted">{m.status.replace('_', ' ')}</span>
                        {m.upcomingShows === 0 && (
                          <span
                            className="badge badge-warning"
                            title="No theatre has scheduled this yet, so customers can't see it"
                          >
                            No showtimes
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Hero">
                      <button
                        type="button"
                        className={`feature-toggle ${m.featured ? 'is-on' : ''}`}
                        disabled={busyId === m.id}
                        aria-pressed={m.featured}
                        title={m.featured ? 'Remove from homepage hero' : 'Add to homepage hero'}
                        onClick={() =>
                          runAction(
                            m.id,
                            () => setMovieFeatured(m.id, !m.featured),
                            m.featured
                              ? `"${m.title}" removed from the hero.`
                              : `"${m.title}" added to the hero.`
                          )
                        }
                      >
                        <span className="feature-star" aria-hidden="true">★</span>
                        {m.featured ? 'Featured' : 'Feature'}
                      </button>
                    </td>
                    <td className="cell-actions">
                      <div className="row-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={busyId === m.id}
                          onClick={() =>
                            runAction(m.id, () => archiveMovie(m.id), `"${m.title}" archived.`)
                          }
                          title="Hide from customers but keep all ticket records"
                        >
                          Archive
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openDelete(m)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ReasonDialog
        open={Boolean(rejectTarget)}
        name={rejectTarget?.title}
        title={`Send "${rejectTarget?.title}" back?`}
        description="The creator sees this note on the title in their studio and can fix it and resubmit. The movie is not deleted."
        presets={[
          'Cover artwork is low quality or the wrong aspect ratio',
          'Synopsis is missing, too short, or contains errors',
          'Runtime, genre or censor rating looks incorrect',
          'Duplicate of a title already in the catalogue',
        ]}
        placeholder="Tell the creator what to change before resubmitting…"
        confirmLabel="Send back"
        busy={rejecting}
        error={rejectError}
        onCancel={() => {
          setRejectTarget(null);
          setRejectError('');
        }}
        onConfirm={async (reason) => {
          setRejecting(true);
          setRejectError('');
          try {
            await rejectMovie(rejectTarget.id, reason);
            const title = rejectTarget.title;
            setRejectTarget(null);
            load();
            toast.success(`"${title}" sent back to its creator.`);
          } catch (err) {
            setRejectError(apiErrorMessage(err));
          } finally {
            setRejecting(false);
          }
        }}
      />

      <DeleteDialog
        open={Boolean(target)}
        name={target?.title}
        title={`Delete ${target?.title || 'movie'}?`}
        description="This permanently removes the movie from the platform. It cannot be undone."
        consequences={['Every show scheduled against it is removed']}
        impact={impact}
        impactLoading={impactLoading}
        note={note}
        onNoteChange={setNote}
        confirmLabel="Delete movie"
        busy={deleting}
        error={dialogError}
        onCancel={() => {
          setTarget(null);
          setDialogError('');
        }}
        onConfirm={async () => {
          setDeleting(true);
          setDialogError('');
          try {
            await deleteMovie(target.id, note);
            const title = target.title;
            setTarget(null);
            load();
            toast.success(`"${title}" deleted.`);
          } catch (err) {
            setDialogError(apiErrorMessage(err));
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
