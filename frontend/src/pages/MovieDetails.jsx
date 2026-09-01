import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import BackLink from '../components/BackLink';
import ShowtimeBoard from '../components/ShowtimeBoard';
import { getMovie, getShowsForMovie } from '../api/movies';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './MovieDetails.css';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([getMovie(id), getShowsForMovie(id)])
      .then(([movieData, showtimeData]) => {
        setMovie(movieData);
        setShowtimes(showtimeData);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  function handlePickShow(showId) {
    if (!user) {
      navigate('/login', { state: { from: `/shows/${showId}/seats` } });
      return;
    }
    navigate(`/shows/${showId}/seats`);
  }

  if (loading) return <Loading />;
  if (error) return <div className="container page"><ErrorMessage message={error} /></div>;
  if (!movie) return null;

  return (
    <div className="container page">
      <BackLink to="/" label="All movies" />
      <div className="movie-details">
        <div className="movie-details-poster" style={{ backgroundImage: `url(${movie.coverImageUrl})` }} />
        <div>
          <h1>{movie.title}</h1>
          <p className="muted">
            {movie.genre} · {movie.language} · {movie.durationMins} mins · {movie.censorRating}
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            Posted by {movie.creatorName}
          </p>
          <p>{movie.description}</p>
        </div>
      </div>

      <h2 className="section-title">Showtimes</h2>
      <ShowtimeBoard
        shows={showtimes?.shows ?? []}
        windowDays={showtimes?.windowDays ?? 2}
        nextShowAfterWindow={showtimes?.nextShowAfterWindow}
        onPick={handlePickShow}
      />
    </div>
  );
}
