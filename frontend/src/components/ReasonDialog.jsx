import { useEffect, useRef, useState } from 'react';
import './DeleteDialog.css';

const APPLICATION_PRESETS = [
  'Business details could not be verified',
  'Incomplete or inconsistent information provided',
  'Duplicate application for an existing account',
  'Does not meet CineSphere partner requirements',
];

/**
 * Rejecting something requires a written reason - whoever submitted it is shown
 * the text verbatim, so it can't be skipped. Presets keep the common cases fast
 * without forcing boilerplate typing.
 *
 * Defaults describe a business application; pass `title`/`description`/
 * `presets`/`confirmLabel` to reuse it for anything else (movie submissions do).
 */
export default function ReasonDialog({
  open,
  name,
  title,
  description,
  presets = APPLICATION_PRESETS,
  placeholder = 'Explain briefly why this application was turned down…',
  confirmLabel = 'Send rejection',
  busy = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  const [reason, setReason] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReason('');
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

  const valid = reason.trim().length >= 10;

  return (
    <div className="dd-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="dd-modal" role="dialog" aria-modal="true" aria-labelledby="rd-title">
        <h3 id="rd-title" className="dd-title">
          {title || `Reject ${name}'s application`}
        </h3>
        <p className="dd-desc muted">
          {description ||
            "The applicant is shown this reason the next time they try to sign in. Their registration is then removed automatically, and they're free to apply again."}
        </p>

        <div className="rd-presets">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className={`rd-preset ${reason === p ? 'is-on' : ''}`}
              onClick={() => setReason(p)}
              disabled={busy}
            >
              {p}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error dd-error">{error}</div>}

        <label className="dd-label" htmlFor="rd-input">
          Reason
        </label>
        <textarea
          id="rd-input"
          ref={inputRef}
          className="dd-input rd-textarea"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
        />
        <span className="rd-hint dim">
          {reason.trim().length < 10
            ? `At least ${10 - reason.trim().length} more character(s)`
            : `${reason.trim().length}/500`}
        </span>

        <div className="dd-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn dd-danger"
            onClick={() => onConfirm(reason.trim())}
            disabled={!valid || busy}
          >
            {busy ? 'Rejecting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
