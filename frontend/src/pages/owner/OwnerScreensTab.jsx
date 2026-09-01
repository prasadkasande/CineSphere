import { useEffect, useRef, useState } from 'react';
import { TableSkeleton } from '../../components/Skeleton';
import ErrorMessage from '../../components/ErrorMessage';
import DeleteDialog from '../../components/DeleteDialog';
import ScreenLayoutForm from '../../components/ScreenLayoutForm';
import RevealPanel from '../../components/RevealPanel';
import {
  createScreen,
  deleteScreen,
  getMyTheatres,
  getScreenDeletionImpact,
  getScreensByTheatre,
  updateScreen,
} from '../../api/owner';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import './OwnerScreensTab.css';

const SEAT_TYPES = ['SILVER', 'GOLD', 'RECLINER'];
const emptyRows = () => [{ rowLabel: 'A', seatCount: 8, seatType: 'SILVER' }];

/** Existing seats -> the row config that produced them. */
function rowsFromSeats(seats) {
  const byRow = new Map();
  for (const seat of seats) {
    const row = byRow.get(seat.rowLabel) || { rowLabel: seat.rowLabel, seatCount: 0, seatType: seat.seatType };
    row.seatCount += 1;
    byRow.set(seat.rowLabel, row);
  }
  return [...byRow.values()].sort((a, b) => a.rowLabel.localeCompare(b.rowLabel));
}

export default function OwnerScreensTab() {
  const toast = useToast();
  const formRef = useRef(null);

  const [theatres, setTheatres] = useState([]);
  const [theatreId, setTheatreId] = useState('');
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formMode, setFormMode] = useState('none'); // none | add | edit
  const [editingScreen, setEditingScreen] = useState(null);
  const [screenName, setScreenName] = useState('');
  const [rows, setRows] = useState(emptyRows());

  const [target, setTarget] = useState(null);
  const [impact, setImpact] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [note, setNote] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getMyTheatres()
      .then((data) => {
        setTheatres(data);
        if (data.length > 0) setTheatreId(String(data[0].id));
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  function refreshScreens(id = theatreId) {
    if (!id) return Promise.resolve();
    return getScreensByTheatre(id).then(setScreens).catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(() => {
    if (!theatreId) {
      setScreens([]);
      return;
    }
    resetForm();
    refreshScreens(theatreId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theatreId]);

  function resetForm() {
    setFormMode('none');
    setEditingScreen(null);
    setScreenName('');
    setRows(emptyRows());
    setFormError('');
  }

  /** Bring the panel into view once it has had a frame to expand. */
  function revealForm() {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }

  function startAdd() {
    setFormMode('add');
    setEditingScreen(null);
    setScreenName('');
    setRows(emptyRows());
    setFormError('');
    revealForm();
  }

  function startEdit(screen) {
    setFormMode('edit');
    setEditingScreen(screen);
    setScreenName(screen.name);
    setRows(rowsFromSeats(screen.seats));
    setFormError('');
    revealForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    const payload = {
      name: screenName,
      rows: rows.map((r) => ({ ...r, rowLabel: r.rowLabel.trim().toUpperCase(), seatCount: Number(r.seatCount) })),
    };
    try {
      if (editingScreen) {
        await updateScreen(editingScreen.id, payload);
        toast.success(`${payload.name} updated.`);
      } else {
        await createScreen({ theatreId: Number(theatreId), ...payload });
        toast.success(`${payload.name} created.`);
      }
      resetForm();
      refreshScreens();
    } catch (err) {
      const message = apiErrorMessage(err);
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function openDelete(screen) {
    setDialogError('');
    setNote('');
    setImpact(null);
    setTarget(screen);
    setImpactLoading(true);
    getScreenDeletionImpact(screen.id)
      .then(setImpact)
      .catch(() => {})
      .finally(() => setImpactLoading(false));
  }

  async function confirmDelete() {
    setDeleting(true);
    setDialogError('');
    try {
      await deleteScreen(target.id, note);
      const name = target.name;
      setTarget(null);
      if (editingScreen?.id === target.id) resetForm();
      refreshScreens();
      toast.success(`${name} removed.`);
    } catch (err) {
      setDialogError(apiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <TableSkeleton />;

  if (theatres.length === 0) {
    return <div className="empty-state">Register a theatre first before adding screens.</div>;
  }

  return (
    <div>
      <div className="field screens-theatre-picker">
        <label htmlFor="screens-theatre">Theatre</label>
        <select id="screens-theatre" value={theatreId} onChange={(e) => setTheatreId(e.target.value)}>
          {theatres.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.approved ? '' : '(pending approval)'}
            </option>
          ))}
        </select>
      </div>

      <ErrorMessage message={error} />

      <section className="section">
        <div className="section-head">
          <h2>Screens</h2>
          <div className="section-head-right">
            <span className="badge badge-muted">{screens.length}</span>
            {formMode !== 'add' && (
              <button type="button" className="btn btn-sm" onClick={startAdd}>
                Add a screen
              </button>
            )}
          </div>
        </div>

        {screens.length === 0 ? (
          <div className="empty-state screens-empty">
            <span className="screens-empty-icon" aria-hidden="true">🎦</span>
            <strong>No screens yet</strong>
            <p className="muted">
              Add a screen and lay out its seats before you can schedule shows here.
            </p>
            {formMode !== 'add' && (
              <button type="button" className="btn" onClick={startAdd}>
                Add your first screen
              </button>
            )}
          </div>
        ) : (
          <div className="screen-grid">
            {screens.map((s) => (
              <div
                key={s.id}
                className={`card screen-card ${editingScreen?.id === s.id ? 'is-editing' : ''}`}
              >
                <div className="screen-card-head">
                  <div className="screen-card-id">
                    <strong>{s.name}</strong>
                    <span className="muted">
                      {s.seats.length} seats · {rowsFromSeats(s.seats).length} rows
                    </span>
                  </div>
                  <div className="screen-card-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(s)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => openDelete(s)}>
                      Delete
                    </button>
                  </div>
                </div>

                {/* A miniature of the actual room - far more informative than a
                    padded card, and it makes the tier mix legible at a glance. */}
                <div className="screen-map" aria-hidden="true">
                  <div className="screen-map-bar" />
                  <div className="screen-map-rows">
                    {rowsFromSeats(s.seats).map((row) => (
                      <div key={row.rowLabel} className="screen-map-row">
                        <span className="screen-map-label">{row.rowLabel}</span>
                        <span className={`screen-map-dots tier-${row.seatType.toLowerCase()}`}>
                          {Array.from({ length: Math.min(row.seatCount, 20) }, (_, n) => (
                            <i key={n} />
                          ))}
                          {row.seatCount > 20 && <em>+{row.seatCount - 20}</em>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="screen-tiers">
                  {SEAT_TYPES.filter((t) => s.seats.some((seat) => seat.seatType === t)).map((t) => (
                    <span key={t} className={`screen-tier tier-${t.toLowerCase()}`}>
                      <i aria-hidden="true" />
                      {s.seats.filter((seat) => seat.seatType === t).length} {t.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section" ref={formRef}>
        <RevealPanel open={formMode !== 'none'}>
          <ScreenLayoutForm
            editingScreen={editingScreen}
            name={screenName}
            onNameChange={setScreenName}
            rows={rows}
            onRowsChange={setRows}
            submitting={submitting}
            error={formError}
            onSubmit={handleSubmit}
            onCancel={resetForm}
          />
        </RevealPanel>
      </section>

      <DeleteDialog
        open={Boolean(target)}
        name={target?.name}
        title={`Delete ${target?.name || 'screen'}?`}
        description="This permanently removes the screen, its seat layout, and every show scheduled on it. It cannot be undone."
        consequences={['All shows scheduled on this screen are removed']}
        impact={impact}
        impactLoading={impactLoading}
        note={note}
        onNoteChange={setNote}
        confirmLabel="Delete screen"
        busy={deleting}
        error={dialogError}
        onCancel={() => {
          setTarget(null);
          setDialogError('');
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
