import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { StatGridSkeleton, TableSkeleton } from '../../components/Skeleton';
import CreatorMoviesTab from './CreatorMoviesTab';
import CreatorPostTab from './CreatorPostTab';
import { createMovie, deleteMovie, getCreatorStats, getMyMovies, updateMovie } from '../../api/creator';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import './CreatorDashboard.css';

const emptyForm = {
  title: '',
  description: '',
  genre: '',
  language: '',
  durationMins: 100,
  censorRating: '',
  status: 'NOW_SHOWING',
};

export default function CreatorDashboard() {
  const toast = useToast();
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  function load() {
    setLoading(true);
    getMyMovies()
      .then(setMovies)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
    getCreatorStats().then(setStats).catch(() => {});
  }

  useEffect(load, []);

  function startEdit(movie) {
    setEditingId(movie.id);
    setForm({ ...movie, durationMins: movie.durationMins || 100 });
    setCoverFile(null);
    setPreviewUrl(movie.coverImageUrl);
    setError('');
    setTab('post');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setCoverFile(null);
    setPreviewUrl(null);
    setError('');
  }

  function handleCoverChange(file) {
    setCoverFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      // Clearing during an edit drops back to no art rather than silently
      // re-showing the stored image the user just removed.
      setPreviewUrl(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editingId && !coverFile) {
      setError('A cover image is required for a new movie.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form, durationMins: Number(form.durationMins), coverImage: coverFile };
      const wasEditing = Boolean(editingId);
      if (wasEditing) {
        await updateMovie(editingId, payload);
      } else {
        await createMovie(payload);
      }
      resetForm();
      load();
      setTab('movies');
      toast.success(wasEditing ? 'Movie updated.' : `"${payload.title}" submitted for admin approval.`);
    } catch (err) {
      const message = apiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await deleteMovie(id);
      if (editingId === id) resetForm();
      load();
      toast.success('Movie removed.');
    } catch (err) {
      const message = apiErrorMessage(err);
      setError(message);
      toast.error(message);
    }
  }

  const needsAttention = movies.filter((m) => m.approvalStatus === 'REJECTED').length;

  const TABS = [
    { key: 'movies', label: 'My movies', badge: movies.length || null },
    { key: 'post', label: editingId ? 'Edit movie' : 'Post a movie' },
  ];

  return (
    <div className="container page">
      <PageHeader
        title="Creator Studio"
        subtitle="Post movies for theatre owners to schedule shows against."
        actions={
          tab !== 'post' && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                resetForm();
                setTab('post');
              }}
            >
              Post a movie
            </button>
          )
        }
      />

      {stats ? (
        <div className="grid stat-grid stagger">
          <StatCard label="Tickets sold" value={stats.ticketsSold} accent hint="Across all your titles" />
          <StatCard
            label="Movies posted"
            value={stats.movieCount}
            hint={`${stats.nowShowingCount} showing · ${stats.upcomingCount} upcoming`}
          />
          <StatCard label="Shows scheduled" value={stats.showCount} hint="By theatre owners" />
          <StatCard label="Theatres screening" value={stats.theatreCount} />
        </div>
      ) : (
        <StatGridSkeleton />
      )}

      {needsAttention > 0 && tab !== 'post' && (
        <div className="alert alert-error creator-attention">
          {needsAttention} {needsAttention === 1 ? 'title needs' : 'titles need'} changes before an admin
          will approve {needsAttention === 1 ? 'it' : 'them'} — open{' '}
          {needsAttention === 1 ? 'it' : 'them'} below to see why.
        </div>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <div
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.badge != null && <span className="tab-count">{t.badge}</span>}
          </div>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : tab === 'movies' ? (
        <CreatorMoviesTab
          movies={movies}
          onEdit={startEdit}
          onDelete={handleDelete}
          onChanged={load}
          onPostFirst={() => {
            resetForm();
            setTab('post');
          }}
        />
      ) : (
        <CreatorPostTab
          form={form}
          setForm={setForm}
          coverFile={coverFile}
          previewUrl={previewUrl}
          onCoverChange={handleCoverChange}
          editingId={editingId}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
          onCancelEdit={() => {
            resetForm();
            setTab('movies');
          }}
        />
      )}
    </div>
  );
}
