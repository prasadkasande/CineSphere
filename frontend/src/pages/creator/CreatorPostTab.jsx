import ErrorMessage from '../../components/ErrorMessage';
import ImageUpload from '../../components/ImageUpload';

const STATUS_OPTIONS = [
  { value: 'NOW_SHOWING', label: 'Now showing', hint: 'Ready for theatres to schedule right away' },
  { value: 'UPCOMING', label: 'Upcoming', hint: 'Announced, not yet playing' },
  { value: 'ARCHIVED', label: 'Archived', hint: 'Hidden from the catalogue' },
];

/**
 * The post/edit form. Laid out as three labelled groups across the page width
 * rather than a single narrow column, so a nine-field form doesn't become a
 * tall strip beside an empty screen.
 */
export default function CreatorPostTab({
  form,
  setForm,
  coverFile,
  previewUrl,
  onCoverChange,
  editingId,
  submitting,
  error,
  onSubmit,
  onCancelEdit,
}) {
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="card creator-post">
      <div className="creator-post-head">
        <div>
          <h2 className="creator-post-title">{editingId ? 'Edit movie' : 'Post a new movie'}</h2>
          <p className="muted creator-post-sub">
            {editingId
              ? 'Changes go live immediately — editing does not re-trigger admin approval.'
              : 'Submitted titles are reviewed by an admin before theatres can schedule them.'}
          </p>
        </div>
        {editingId && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelEdit}>
            Cancel edit
          </button>
        )}
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={onSubmit}>
        <div className="creator-post-grid">
          <section className="creator-post-group">
            <h3 className="creator-post-legend">The title</h3>

            <div className="field">
              <label htmlFor="movie-title">Title</label>
              <input id="movie-title" required value={form.title} onChange={set('title')} />
            </div>

            <div className="field">
              <label htmlFor="movie-description">Synopsis</label>
              <textarea
                id="movie-description"
                rows={6}
                maxLength={2000}
                placeholder="What is it about? This is what customers read on the movie page."
                value={form.description || ''}
                onChange={set('description')}
              />
            </div>
          </section>

          <section className="creator-post-group">
            <h3 className="creator-post-legend">Details</h3>

            <div className="creator-post-pair">
              <div className="field">
                <label htmlFor="movie-genre">Genre</label>
                <input id="movie-genre" placeholder="e.g. Sci-fi" value={form.genre || ''} onChange={set('genre')} />
              </div>
              <div className="field">
                <label htmlFor="movie-language">Language</label>
                <input
                  id="movie-language"
                  placeholder="e.g. English"
                  value={form.language || ''}
                  onChange={set('language')}
                />
              </div>
              <div className="field">
                <label htmlFor="movie-duration">Runtime (mins)</label>
                <input
                  id="movie-duration"
                  type="number"
                  min={1}
                  max={600}
                  value={form.durationMins}
                  onChange={set('durationMins')}
                />
              </div>
              <div className="field">
                <label htmlFor="movie-rating">Censor rating</label>
                <input
                  id="movie-rating"
                  placeholder="e.g. PG-13"
                  value={form.censorRating || ''}
                  onChange={set('censorRating')}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="movie-status">Release status</label>
              <select id="movie-status" value={form.status} onChange={set('status')}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="creator-post-hint">
                {STATUS_OPTIONS.find((o) => o.value === form.status)?.hint}
              </span>
            </div>
          </section>

          <section className="creator-post-group">
            <h3 className="creator-post-legend">Artwork</h3>

            <ImageUpload
              label="Cover image"
              required={!editingId}
              value={coverFile}
              previewUrl={previewUrl}
              onChange={onCoverChange}
              hint={
                editingId
                  ? 'Leave as-is to keep the current artwork.'
                  : 'Portrait poster art works best — it fills the movie card.'
              }
            />

            <button className="btn btn-block creator-post-submit" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Submit for approval'}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}
