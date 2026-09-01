import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import BackLink from '../components/BackLink';
import { getShow, getSeatMap, lockSeats } from '../api/shows';
import { apiErrorMessage } from '../api/client';
import './SeatSelection.css';

const SEAT_TYPE_LABEL = {
  SILVER: 'Silver',
  GOLD: 'Gold',
  RECLINER: 'Recliner',
};

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locking, setLocking] = useState(false);

  const refreshSeats = useCallback(() => {
    getSeatMap(id)
      .then((data) => {
        setSeats(data);
        const stillAvailable = new Set(
          data.filter((s) => s.status === 'AVAILABLE').map((s) => s.seatId)
        );
        setSelected((prev) => prev.filter((seatId) => stillAvailable.has(seatId)));
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([getShow(id), getSeatMap(id)])
      .then(([showData, seatData]) => {
        setShow(showData);
        setSeats(seatData);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const interval = setInterval(refreshSeats, 5000);
    return () => clearInterval(interval);
  }, [refreshSeats]);

  function toggleSeat(seat) {
    if (seat.status !== 'AVAILABLE') return;
    setSelected((prev) =>
      prev.includes(seat.seatId) ? prev.filter((s) => s !== seat.seatId) : [...prev, seat.seatId]
    );
  }

  const rows = useMemo(() => {
    const grouped = {};
    for (const seat of seats) {
      grouped[seat.rowLabel] = grouped[seat.rowLabel] || [];
      grouped[seat.rowLabel].push(seat);
    }
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  const total = useMemo(() => {
    return seats
      .filter((s) => selected.includes(s.seatId))
      .reduce((sum, s) => sum + s.price, 0);
  }, [seats, selected]);

  async function handleProceed() {
    setError('');
    setLocking(true);
    try {
      const lockResult = await lockSeats(id, selected);
      navigate('/checkout', {
        state: {
          showId: id,
          seatIds: selected,
          expiresAt: lockResult.expiresAt,
          show,
          seats: seats.filter((s) => selected.includes(s.seatId)),
        },
      });
    } catch (err) {
      setError(apiErrorMessage(err));
      refreshSeats();
    } finally {
      setLocking(false);
    }
  }

  if (loading) return <Loading />;
  if (error && !show) return <div className="container page"><ErrorMessage message={error} /></div>;
  if (!show) return null;

  return (
    <div className="container page">
      <BackLink to={`/movies/${show.movieId}`} label="Showtimes" />
      <h1>{show.movieTitle}</h1>
      <p className="muted">
        {show.theatreName} · {show.screenName} ·{' '}
        {new Date(show.showDateTime).toLocaleString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>

      <ErrorMessage message={error} />

      <div className="screen-bar">Screen this way</div>

      <div className="seat-map-scroll">
      <div className="seat-map">
        {rows.map(([rowLabel, rowSeats]) => (
          <div className="seat-row" key={rowLabel}>
            <span className="row-label">{rowLabel}</span>
            <div className="seat-row-seats">
              {rowSeats
                .sort((a, b) => a.seatNumber - b.seatNumber)
                .map((seat) => (
                  <button
                    key={seat.seatId}
                    className={`seat seat-${seat.seatType.toLowerCase()} ${
                      selected.includes(seat.seatId) ? 'seat-selected' : ''
                    } ${seat.status !== 'AVAILABLE' ? `seat-${seat.status.toLowerCase()}` : ''}`}
                    disabled={seat.status !== 'AVAILABLE'}
                    onClick={() => toggleSeat(seat)}
                    title={`${seat.rowLabel}${seat.seatNumber} · ${SEAT_TYPE_LABEL[seat.seatType]} · $${seat.price.toFixed(2)}`}
                  >
                    {seat.seatNumber}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      </div>

      <div className="seat-legend">
        <span><i className="legend-dot legend-available" />Available</span>
        <span><i className="legend-dot legend-selected" />Selected</span>
        <span><i className="legend-dot legend-taken" />Taken</span>
      </div>

      <div className="checkout-bar card">
        <div>
          <div>{selected.length} seat(s) selected</div>
          <div className="muted">Total: ${total.toFixed(2)}</div>
        </div>
        <button className="btn" disabled={selected.length === 0 || locking} onClick={handleProceed}>
          {locking ? 'Holding seats…' : 'Proceed to Pay'}
        </button>
      </div>
    </div>
  );
}
