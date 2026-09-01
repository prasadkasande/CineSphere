import { useMemo } from 'react';
import ErrorMessage from './ErrorMessage';
import './ScreenLayoutForm.css';

const SEAT_TYPES = ['SILVER', 'GOLD', 'RECLINER'];
const TIER_LABEL = { SILVER: 'Silver', GOLD: 'Gold', RECLINER: 'Recliner' };
/** Capped so one row of dots can't blow the preview's width apart. */
const PREVIEW_MAX_DOTS = 24;

/**
 * Add or edit a screen's layout. One wide form for both, because the two are
 * the same job - the only difference is whether seats already exist.
 *
 * The preview is the point: laying a room out row-by-row in inputs is abstract,
 * and an owner needs to see the shape before committing to it.
 */
export default function ScreenLayoutForm({
  editingScreen,
  name,
  onNameChange,
  rows,
  onRowsChange,
  submitting,
  error,
  onSubmit,
  onCancel,
}) {
  const totalSeats = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.seatCount) || 0), 0),
    [rows],
  );

  const tierTotals = useMemo(() => {
    const totals = {};
    for (const r of rows) {
      totals[r.seatType] = (totals[r.seatType] || 0) + (Number(r.seatCount) || 0);
    }
    return totals;
  }, [rows]);

  const updateRow = (index, field, value) =>
    onRowsChange(rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const addRow = () => {
    // Continue the alphabet from the last row rather than starting blank.
    const last = rows[rows.length - 1]?.rowLabel || '';
    const next = last.length === 1 && last >= 'A' && last < 'Z'
      ? String.fromCharCode(last.charCodeAt(0) + 1)
      : '';
    onRowsChange([...rows, { rowLabel: next, seatCount: 8, seatType: 'SILVER' }]);
  };

  const removeRow = (index) => onRowsChange(rows.filter((_, i) => i !== index));

  return (
    <div className="card screen-form">
      <div className="screen-form-head">
        <div>
          <h3 className="screen-form-title">
            {editingScreen ? `Edit ${editingScreen.name}` : 'Add a screen'}
          </h3>
          <p className="muted screen-form-sub">
            {editingScreen
              ? 'Change the name, retier rows, or grow and shrink them. Seats that stay keep their existing tickets.'
              : 'Lay the room out row by row. Each row becomes numbered seats of one tier.'}
          </p>
        </div>
        {/* Always dismissible - the panel is opened on demand, so there has to
            be a way back out of it whether adding or editing. */}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          {editingScreen ? 'Cancel edit' : 'Cancel'}
        </button>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={onSubmit}>
        <div className="screen-form-grid">
          <section className="screen-form-group">
            <h4 className="screen-form-legend">Screen</h4>

            <div className="field">
              <label htmlFor="screen-name">Name</label>
              <input
                id="screen-name"
                required
                placeholder="e.g. Screen 1, IMAX, Audi 3"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>

            <div className="tier-legend">
              <span className="screen-form-legend">Seat tiers</span>
              {SEAT_TYPES.map((t) => (
                <div key={t} className={`tier-legend-row tier-${t.toLowerCase()}`}>
                  <i aria-hidden="true" />
                  <span>{TIER_LABEL[t]}</span>
                  <strong>{tierTotals[t] || 0}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="screen-form-group">
            <h4 className="screen-form-legend">Seat rows</h4>

            <div className="row-editor">
              <div className="row-editor-head" aria-hidden="true">
                <span>Row</span>
                <span>Seats</span>
                <span>Tier</span>
                <span />
              </div>

              {rows.map((row, i) => (
                <div key={i} className="row-editor-row">
                  <input
                    aria-label={`Row ${i + 1} label`}
                    placeholder="A"
                    required
                    maxLength={3}
                    className="row-editor-label"
                    value={row.rowLabel}
                    onChange={(e) => updateRow(i, 'rowLabel', e.target.value.toUpperCase())}
                  />
                  <input
                    aria-label={`Row ${i + 1} seat count`}
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={row.seatCount}
                    onChange={(e) => updateRow(i, 'seatCount', e.target.value)}
                  />
                  <select
                    aria-label={`Row ${i + 1} seat tier`}
                    value={row.seatType}
                    onChange={(e) => updateRow(i, 'seatType', e.target.value)}
                  >
                    {SEAT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TIER_LABEL[t]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="row-editor-remove"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    aria-label={`Remove row ${row.rowLabel || i + 1}`}
                    title={rows.length === 1 ? 'A screen needs at least one row' : 'Remove this row'}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-ghost btn-sm row-editor-add" onClick={addRow}>
              + Add row
            </button>
          </section>

          <section className="screen-form-group">
            <h4 className="screen-form-legend">Preview</h4>

            <div className="seat-preview">
              <div className="seat-preview-screen">SCREEN</div>
              <div className="seat-preview-rows">
                {rows.map((row, i) => {
                  const count = Math.max(0, Number(row.seatCount) || 0);
                  const shown = Math.min(count, PREVIEW_MAX_DOTS);
                  return (
                    <div key={i} className="seat-preview-row">
                      <span className="seat-preview-label">{row.rowLabel || '·'}</span>
                      <span className={`seat-preview-dots tier-${row.seatType.toLowerCase()}`}>
                        {Array.from({ length: shown }, (_, n) => (
                          <i key={n} aria-hidden="true" />
                        ))}
                        {count > shown && <em>+{count - shown}</em>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="capacity-summary">
              <span className="muted">Total capacity</span>
              <strong>
                {totalSeats} seat{totalSeats === 1 ? '' : 's'}
              </strong>
            </div>

            <button className="btn btn-block" type="submit" disabled={submitting || totalSeats === 0}>
              {submitting
                ? 'Saving…'
                : editingScreen
                  ? 'Save changes'
                  : 'Create screen'}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}
