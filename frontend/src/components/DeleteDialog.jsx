import { useEffect, useRef, useState } from 'react';
import './DeleteDialog.css';

/**
 * Destructive-action guard. The admin has to type the record's exact name
 * before the button enables, and any tickets that will be refunded as a
 * consequence are shown with their cost before they commit.
 */
export default function DeleteDialog({
  open,
  name,
  title = 'Delete',
  description,
  consequences = [],
  impact,
  impactLoading = false,
  confirmLabel = 'Delete permanently',
  busy = false,
  error = '',
  note,
  onNoteChange,
  onCancel,
  onConfirm,
}) {
  const [typed, setTyped] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTyped('');
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, name]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const matches = typed.trim() === (name || '').trim();
  const refunds = impact?.confirmedBookings ?? 0;

  return (
    <div className="dd-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="dd-modal" role="dialog" aria-modal="true" aria-labelledby="dd-title">
        <h3 id="dd-title" className="dd-title">
          {title}
        </h3>

        {description && <p className="dd-desc muted">{description}</p>}

        {impactLoading && <p className="dd-desc dim">Checking what this affects…</p>}

        {/* Money leaving the platform gets its own prominent callout. */}
        {!impactLoading && refunds > 0 && (
          <div className="dd-refund">
            <strong className="dd-refund-head">
              {refunds} paid ticket{refunds === 1 ? '' : 's'} will be refunded
            </strong>
            <span className="dd-refund-amount">${Number(impact.refundTotal).toFixed(2)}</span>
            <span className="dd-refund-sub">
              across {impact.affectedCustomers} customer{impact.affectedCustomers === 1 ? '' : 's'} — they'll
              see the refund in their bookings.
            </span>
          </div>
        )}

        {consequences.length > 0 && (
          <ul className="dd-consequences">
            {consequences.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}

        {refunds > 0 && onNoteChange && (
          <div className="dd-note">
            <label htmlFor="dd-note">Reason shown to refunded customers (optional)</label>
            <input
              id="dd-note"
              value={note || ''}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="e.g. Screening cancelled by the distributor"
              disabled={busy}
            />
          </div>
        )}

        {error && <div className="alert alert-error dd-error">{error}</div>}

        <label className="dd-label" htmlFor="dd-input">
          Type <strong>{name}</strong> to confirm
        </label>
        <input
          id="dd-input"
          ref={inputRef}
          className="dd-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={name}
          autoComplete="off"
          spellCheck="false"
          disabled={busy}
        />

        <div className="dd-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn dd-danger"
            onClick={onConfirm}
            disabled={!matches || busy || impactLoading}
            title={matches ? undefined : 'Type the exact name to enable'}
          >
            {busy
              ? 'Deleting…'
              : refunds > 0
                ? `Refund & ${confirmLabel.toLowerCase()}`
                : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
