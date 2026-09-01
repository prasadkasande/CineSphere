import { useState } from 'react';

/**
 * Two-step inline confirm instead of window.confirm() - native confirm()
 * dialogs get suppressed in some embedded/iframe browser contexts, so a
 * blocking confirm() can silently no-op there.
 */
export default function ConfirmButton({ onConfirm, disabled, className = 'btn btn-outline-danger btn-sm', label = 'Cancel', confirmLabel = 'Confirm?', busyLabel = 'Working…' }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" className={className} disabled={disabled} onClick={() => setConfirming(true)}>
        {label}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button type="button" className={className} disabled={busy || disabled} onClick={handleConfirm}>
        {busy ? busyLabel : confirmLabel}
      </button>
      <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setConfirming(false)}>
        Nevermind
      </button>
    </div>
  );
}
