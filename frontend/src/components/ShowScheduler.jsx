import { useEffect, useMemo, useState } from 'react';
import DateTimePicker, { DatePicker, TimePicker, formatTimeLabel } from './DateTimePicker';
import ErrorMessage from './ErrorMessage';
import {
  createRecurringShows,
  createShow,
  getScreensByTheatre,
  previewRecurringShows,
} from '../api/owner';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import './ShowScheduler.css';

/**
 * The owner's programming desk: one screening, or a whole run of them.
 *
 * A recurring run is never written blind - the owner describes the pattern, the
 * backend returns the exact list of screenings it would create (marking any that
 * clash with something already on that screen), and only then is it committed.
 */

const SEAT_TYPES = ['SILVER', 'GOLD', 'RECLINER'];
const DAY_LABELS = [
  ['MONDAY', 'M'],
  ['TUESDAY', 'T'],
  ['WEDNESDAY', 'W'],
  ['THURSDAY', 'T'],
  ['FRIDAY', 'F'],
  ['SATURDAY', 'S'],
  ['SUNDAY', 'S'],
];
const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const WEEKEND = ['SATURDAY', 'SUNDAY'];

/** The patterns a cinema actually programmes, as one-click starting points. */
const PRESETS = [
  {
    id: 'daily',
    label: 'Every day',
    frequency: 'DAILY',
    interval: 1,
    days: [],
  },
  {
    id: 'weekdays',
    label: 'Weekdays',
    frequency: 'WEEKLY',
    interval: 1,
    days: WEEKDAYS,
  },
  {
    id: 'weekends',
    label: 'Weekends',
    frequency: 'WEEKLY',
    interval: 1,
    days: WEEKEND,
  },
  {
    id: 'alternate',
    label: 'Every other day',
    frequency: 'DAILY',
    interval: 2,
    days: [],
  },
  {
    id: 'custom',
    label: 'Custom',
    frequency: 'WEEKLY',
    interval: 1,
    days: ['FRIDAY'],
  },
];

const todayKey = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const addDays = (key, days) => {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const shortDate = (key) =>
  new Date(`${key}T00:00`).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  });

export default function ShowScheduler({
  movies,
  theatres,
  preselectedMovieId,
  onScheduled,
  /** Optional - omit when the surrounding page already provides a heading. */
  title,
}) {
  const toast = useToast();

  const [mode, setMode] = useState('single');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /* ---- what is playing, and where ---- */
  const [movieId, setMovieId] = useState('');
  const [theatreId, setTheatreId] = useState('');
  const [screenId, setScreenId] = useState('');
  const [screens, setScreens] = useState([]);
  const [prices, setPrices] = useState({
    SILVER: '8.00',
    GOLD: '12.00',
    RECLINER: '18.00',
  });

  /* ---- one-off ---- */
  const [showDateTime, setShowDateTime] = useState('');

  /* ---- recurring ---- */
  const [preset, setPreset] = useState('daily');
  const [frequency, setFrequency] = useState('DAILY');
  const [interval, setIntervalValue] = useState(1);
  const [days, setDays] = useState([]);
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(addDays(todayKey(), 13));
  const [times, setTimes] = useState(['19:00']);
  const [draftTime, setDraftTime] = useState('21:30');
  const [plan, setPlan] = useState(null);

  /* ---- defaults ---- */
  useEffect(() => {
    if (!movieId && movies.length > 0) setMovieId(String(movies[0].id));
  }, [movies, movieId]);

  useEffect(() => {
    if (!theatreId && theatres.length > 0) setTheatreId(String(theatres[0].id));
  }, [theatres, theatreId]);

  useEffect(() => {
    if (preselectedMovieId) setMovieId(String(preselectedMovieId));
  }, [preselectedMovieId]);

  useEffect(() => {
    if (!theatreId) {
      setScreens([]);
      setScreenId('');
      return;
    }
    getScreensByTheatre(theatreId).then((data) => {
      setScreens(data);
      setScreenId(data.length > 0 ? String(data[0].id) : '');
    });
  }, [theatreId]);

  // Any change to the pattern invalidates a preview the owner is looking at.
  useEffect(() => {
    setPlan(null);
  }, [movieId, screenId, frequency, interval, days, startDate, endDate, times]);

  const canSubmit = movies.length > 0 && screens.length > 0;

  const patternSummary = useMemo(() => {
    if (times.length === 0) return 'Add at least one show time';
    const cadence =
      frequency === 'DAILY'
        ? interval === 1
          ? 'Every day'
          : `Every ${interval} days`
        : days.length === 0
          ? 'Pick at least one weekday'
          : `${days.map((d) => d.slice(0, 3).charAt(0) + d.slice(1, 3).toLowerCase()).join(', ')}${
              interval === 1 ? ' weekly' : ` every ${interval} weeks`
            }`;
    const perDay = times.length === 1 ? '1 show a day' : `${times.length} shows a day`;
    return `${cadence} · ${perDay} · ${shortDate(startDate)} – ${shortDate(endDate)}`;
  }, [frequency, interval, days, times, startDate, endDate]);

  function applyPreset(id) {
    const chosen = PRESETS.find((p) => p.id === id);
    setPreset(id);
    setFrequency(chosen.frequency);
    setIntervalValue(chosen.interval);
    setDays(chosen.days);
  }

  function toggleDay(day) {
    setPreset('custom');
    setFrequency('WEEKLY');
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    );
  }

  function addTime() {
    if (!draftTime || times.includes(draftTime)) return;
    setTimes((current) => [...current, draftTime].sort());
  }

  function recurringPayload() {
    return {
      movieId: Number(movieId),
      screenId: Number(screenId),
      startDate,
      endDate,
      times,
      frequency,
      interval: Number(interval),
      daysOfWeek: frequency === 'WEEKLY' ? days : [],
      prices,
    };
  }

  /* ---- actions ---- */

  async function submitSingle(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await createShow({
        movieId: Number(movieId),
        screenId: Number(screenId),
        showDateTime,
        prices,
      });
      setShowDateTime('');
      const title = movies.find((m) => String(m.id) === movieId)?.title || 'Show';
      toast.success(`${title} scheduled.`);
      onScheduled?.();
    } catch (err) {
      const message = apiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function runPreview(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      setPlan(await previewRecurringShows(recurringPayload()));
    } catch (err) {
      const message = apiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function commitPlan() {
    setError('');
    setBusy(true);
    try {
      const result = await createRecurringShows(recurringPayload());
      setPlan(null);
      toast.success(
        `${result.created.length} screening${result.created.length === 1 ? '' : 's'} scheduled.`,
      );
      onScheduled?.();
    } catch (err) {
      const message = apiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  /* ---- render ---- */

  if (theatres.length === 0) {
    return (
      <div className="card">
        {title && <h3 className="sched-title">{title}</h3>}
        <p className="muted">
          You need at least one admin-approved theatre with a screen before you can schedule shows.
        </p>
      </div>
    );
  }

  return (
    <div className="card sched">
      <div className="sched-head">
        {title ? (
          <h3 className="sched-title">{title}</h3>
        ) : (
          <span className="sched-lead">What are you scheduling?</span>
        )}
        <div className="sched-modes" role="tablist" aria-label="Scheduling mode">
          {[
            ['single', 'One-off'],
            ['recurring', 'Recurring'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              className={`sched-mode ${mode === id ? 'is-on' : ''}`}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={mode === 'single' ? submitSingle : runPreview}>
        <div className="sched-body">
          <div className="sched-group">
            <h4 className="sched-legend">What&apos;s playing</h4>

            <div className="field">
              <label htmlFor="sched-movie">Movie</label>
              <select
                id="sched-movie"
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                required
                disabled={movies.length === 0}
              >
                {movies.length === 0 ? (
                  <option value="">No approved movies yet</option>
                ) : (
                  <option value="">Select a movie…</option>
                )}
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="sched-pair">
              <div className="field">
                <label htmlFor="sched-theatre">Theatre</label>
                <select
                  id="sched-theatre"
                  value={theatreId}
                  onChange={(e) => setTheatreId(e.target.value)}
                  required
                >
                  {theatres.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="sched-screen">Screen</label>
                <select
                  id="sched-screen"
                  value={screenId}
                  onChange={(e) => setScreenId(e.target.value)}
                  required
                  disabled={screens.length === 0}
                >
                  {screens.length === 0 && <option value="">No screens</option>}
                  {screens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="sched-group">
            <h4 className="sched-legend">When</h4>

            {mode === 'single' ? (
              <div className="field">
                <label>Date &amp; time</label>
                <DateTimePicker
                  value={showDateTime}
                  onChange={setShowDateTime}
                  invalid={!!error && !showDateTime}
                />
              </div>
            ) : (
              <div className="sched-recurring">
                <div className="field">
                  <label>Repeats</label>
                  <div className="sched-chips">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`sched-chip ${preset === p.id ? 'is-on' : ''}`}
                        onClick={() => applyPreset(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {frequency === 'WEEKLY' && (
                  <div className="field">
                    <label>On these days</label>
                    <div className="sched-days" role="group" aria-label="Days of the week">
                      {DAY_LABELS.map(([day, initial]) => (
                        <button
                          key={day}
                          type="button"
                          aria-label={day.charAt(0) + day.slice(1).toLowerCase()}
                          aria-pressed={days.includes(day)}
                          className={`sched-day ${days.includes(day) ? 'is-on' : ''}`}
                          onClick={() => toggleDay(day)}
                        >
                          {initial}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="field sched-interval">
                  <label htmlFor="sched-interval">
                    Repeat every {frequency === 'DAILY' ? 'N days' : 'N weeks'}
                  </label>
                  <input
                    id="sched-interval"
                    type="number"
                    min="1"
                    max="12"
                    value={interval}
                    onChange={(e) => {
                      setPreset('custom');
                      setIntervalValue(e.target.value === '' ? 1 : Number(e.target.value));
                    }}
                  />
                </div>

                <div className="sched-pair">
                  <div className="field">
                    <label>Runs from</label>
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      label="Start date"
                      compact
                    />
                  </div>
                  <div className="field">
                    <label>Until</label>
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      min={startDate}
                      label="End date"
                      compact
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Show times each day</label>
                  <div className="sched-times">
                    {times.map((t) => (
                      <span key={t} className="sched-time">
                        {formatTimeLabel(t)}
                        <button
                          type="button"
                          aria-label={`Remove ${formatTimeLabel(t)}`}
                          onClick={() => setTimes(times.filter((x) => x !== t))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {times.length === 0 && <span className="sched-times-empty">No times yet</span>}
                  </div>
                  <div className="sched-add-time">
                    <TimePicker value={draftTime} onChange={setDraftTime} label="New show time" />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addTime}>
                      Add
                    </button>
                  </div>
                </div>

                <p className="sched-summary">{patternSummary}</p>
              </div>
            )}
          </div>

          <div className="sched-group">
            <h4 className="sched-legend">Ticket prices</h4>

            <div className="price-grid">
              {SEAT_TYPES.map((type) => (
                <div className="field" key={type}>
                  <label htmlFor={`price-${type}`}>{type}</label>
                  <input
                    id={`price-${type}`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={prices[type]}
                    onChange={(e) => setPrices({ ...prices, [type]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <button
              className="btn btn-block"
              type="submit"
              disabled={busy || !canSubmit || (mode === 'single' && !showDateTime)}
            >
              {mode === 'single'
                ? busy
                  ? 'Scheduling…'
                  : 'Schedule show'
                : busy
                  ? 'Working out the run…'
                  : 'Preview this run'}
            </button>

            <p className="sched-hint muted">
              {mode === 'single'
                ? 'The screen is held for the runtime plus a 20 minute turnaround.'
                : 'Nothing is created until you have seen the run and confirmed it.'}
            </p>
          </div>
        </div>
      </form>

      {mode === 'recurring' && plan && (
        <PlanPreview
          plan={plan}
          busy={busy}
          onCancel={() => setPlan(null)}
          onConfirm={commitPlan}
        />
      )}
    </div>
  );
}

/** The dry run: exactly what will be created, and what is in the way. */
function PlanPreview({ plan, busy, onCancel, onConfirm }) {
  const blocked = plan.conflictCount + plan.pastCount;

  return (
    <div className="plan animate-in">
      <div className="plan-head">
        <strong>{plan.readyCount}</strong>
        <span className="muted">
          screening{plan.readyCount === 1 ? '' : 's'} will be created
          {blocked > 0 && ` · ${blocked} skipped`}
        </span>
      </div>

      <p className="plan-note muted">
        Each slot holds the screen for {plan.slotMins} min, runtime plus turnaround.
      </p>

      <ul className="plan-list">
        {plan.occurrences.map((o) => (
          <li key={o.showDateTime} className={`plan-row is-${o.state.toLowerCase()}`}>
            <span className="plan-when">
              {new Date(o.showDateTime).toLocaleString([], {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="plan-state">{o.state === 'READY' ? 'Free' : o.reason}</span>
          </li>
        ))}
      </ul>

      <div className="plan-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={onConfirm}
          disabled={busy || plan.readyCount === 0}
        >
          {busy ? 'Scheduling…' : `Schedule ${plan.readyCount}`}
        </button>
      </div>
    </div>
  );
}
