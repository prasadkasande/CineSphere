import { useEffect, useRef, useState } from 'react';
import { TableSkeleton } from '../../components/Skeleton';
import ErrorMessage from '../../components/ErrorMessage';
import DeleteDialog from '../../components/DeleteDialog';
import RevealPanel from '../../components/RevealPanel';
import OwnerTheatreForm from './OwnerTheatreForm';
import {
  createTheatre,
  deleteTheatre,
  getMyTheatres,
  getTheatreDeletionImpact,
  resubmitTheatre,
  updateTheatre,
} from '../../api/owner';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import './OwnerTheatreForm.css';

const emptyForm = () => ({ name: '', city: '', address: '', phone: '', pincode: '', description: '' });

export default function OwnerTheatresTab() {
  const toast = useToast();
  const editRef = useRef(null);

  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formMode, setFormMode] = useState('none'); // none | register | edit | resubmit
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [target, setTarget] = useState(null);
  const [impact, setImpact] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [note, setNote] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    getMyTheatres()
      .then(setTheatres)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function revealForm() {
    setTimeout(() => editRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }

  function startRegister() {
    setFormMode('register');
    setEditingId(null);
    setForm(emptyForm());
    setError('');
    revealForm();
  }

  /** Rejected registration: prefill the details so the owner can correct them. */
  function startResubmit(theatre) {
    setFormMode('resubmit');
    setEditingId(theatre.id);
    setForm({
      name: theatre.name,
      city: theatre.city,
      address: theatre.address || '',
      phone: theatre.phone || '',
      pincode: theatre.pincode || '',
      description: theatre.description || '',
    });
    setError('');
    revealForm();
  }

  function startEdit(theatre) {
    setFormMode('edit');
    setEditingId(theatre.id);
    setForm({
      name: theatre.name,
      city: theatre.city,
      address: theatre.address || '',
      phone: theatre.phone || '',
      pincode: theatre.pincode || '',
      description: theatre.description || '',
    });
    setError('');
    revealForm();
  }

  function closeForm() {
    setFormMode('none');
    setEditingId(null);
    setForm(emptyForm());
  }

  async function submitForm(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (formMode === 'edit') {
        await updateTheatre(editingId, form);
        toast.success('Theatre updated.');
      } else if (formMode === 'resubmit') {
        await resubmitTheatre(editingId, form);
        toast.success(`${form.name} resent for approval.`);
      } else {
        await createTheatre(form);
        toast.success(`${form.name} submitted for admin approval.`);
      }
      closeForm();
      load();
    } catch (err) {
      const message = apiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function openDelete(theatre) {
    setDialogError('');
    setNote('');
    setImpact(null);
    setTarget(theatre);
    setImpactLoading(true);
    getTheatreDeletionImpact(theatre.id)
      .then(setImpact)
      .catch(() => {})
      .finally(() => setImpactLoading(false));
  }

  async function confirmDelete() {
    setDeleting(true);
    setDialogError('');
    try {
      await deleteTheatre(target.id, note);
      const name = target.name;
      setTarget(null);
      if (editingId === target.id) closeForm();
      load();
      toast.success(`${name} closed.`);
    } catch (err) {
      setDialogError(apiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <TableSkeleton />;

  return (
    <div>
      <section className="section">
        <div className="section-head">
          <h2>My theatres</h2>
          <div className="section-head-right">
            <span className="badge badge-muted">{theatres.length}</span>
            {formMode !== 'register' && (
              <button type="button" className="btn btn-sm" onClick={startRegister}>
                Register a theatre
              </button>
            )}
          </div>
        </div>
        <ErrorMessage message={error} />

        {theatres.filter((t) => t.rejected).map((t) => (
          <div key={t.id} className="alert alert-error theatre-rejected">
            <span className="theatre-rejected-icon" aria-hidden="true">!</span>

            <div className="theatre-rejected-body">
              <strong>{t.name} was not approved.</strong>
              <p>{t.rejectionReason}</p>
              <span className="theatre-rejected-note">
                Removed shortly — resending files a fresh application and keeps any screens you've
                already laid out.
              </span>
            </div>

            <button
              type="button"
              className="btn btn-sm theatre-rejected-action"
              onClick={() => startResubmit(t)}
            >
              Edit &amp; resend
            </button>
          </div>
        ))}

        {theatres.length === 0 ? (
          <div className="empty-state screens-empty">
            <span className="screens-empty-icon" aria-hidden="true">🏛</span>
            <strong>No theatres yet</strong>
            <p className="muted">
              Register a theatre — an admin approves it before it can host shows.
            </p>
            {formMode !== 'register' && (
              <button type="button" className="btn" onClick={startRegister}>
                Register your first theatre
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {theatres.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-lead"><strong>{t.name}</strong></td>
                    <td className="muted" data-label="City">{t.city}</td>
                    <td className="muted" data-label="Phone">{t.phone || '—'}</td>
                    <td data-label="Status">
                      <span
                        className={`badge ${
                          t.approved ? 'badge-success' : t.rejected ? 'badge-danger' : 'badge-warning'
                        }`}
                      >
                        {t.approved ? 'Approved' : t.rejected ? 'Rejected' : 'Pending approval'}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <div className="row-actions">
                        {t.rejected ? (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => startResubmit(t)}
                          >
                            Edit &amp; resend
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => startEdit(t)}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openDelete(t)}
                        >
                          Close
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="section" ref={editRef}>
        <RevealPanel open={formMode !== 'none'}>
          <OwnerTheatreForm
            mode={formMode}
            form={form}
            onChange={setForm}
            submitting={saving}
            error={error}
            onSubmit={submitForm}
            onCancel={closeForm}
          />
        </RevealPanel>
      </section>

      <DeleteDialog
        open={Boolean(target)}
        name={target?.name}
        title={`Close ${target?.name || 'theatre'}?`}
        description="This permanently removes the theatre and everything under it — every screen and every show. It cannot be undone."
        consequences={[
          'All its screens and seat layouts are removed',
          'All shows scheduled there are removed',
        ]}
        impact={impact}
        impactLoading={impactLoading}
        note={note}
        onNoteChange={setNote}
        confirmLabel="Close theatre"
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
