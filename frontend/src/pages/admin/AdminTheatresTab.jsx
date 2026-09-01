import { useEffect, useState } from 'react';
import { TableSkeleton } from '../../components/Skeleton';
import ErrorMessage from '../../components/ErrorMessage';
import DeleteDialog from '../../components/DeleteDialog';
import ReasonDialog from '../../components/ReasonDialog';
import { approveTheatre, deleteTheatre, getAllTheatres, getTheatreDeletionImpact, rejectTheatre } from '../../api/admin';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function AdminTheatresTab() {
  const toast = useToast();
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [target, setTarget] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [impact, setImpact] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [note, setNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState('');

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

  function load() {
    setLoading(true);
    getAllTheatres()
      .then(setTheatres)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleApprove(id) {
    setBusyId(id);
    setError('');
    try {
      await approveTheatre(id);
      load();
      toast.success('Theatre approved.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(reason) {
    setRejecting(true);
    setRejectError('');
    try {
      await rejectTheatre(rejectTarget.id, reason);
      const name = rejectTarget.name;
      setRejectTarget(null);
      load();
      toast.success(`${name} sent back to its owner.`);
    } catch (err) {
      setRejectError(apiErrorMessage(err));
    } finally {
      setRejecting(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    setDialogError('');
    try {
      await deleteTheatre(target.id, note);
      const name = target.name;
      setTarget(null);
      load();
      toast.success(`${name} deleted.`);
    } catch (err) {
      setDialogError(apiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <TableSkeleton />;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Theatres</h2>
      <ErrorMessage message={error} />

      {theatres.length === 0 ? (
        <div className="empty-state">No theatres registered yet.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Owner</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {theatres.map((t) => (
                <tr key={t.id}>
                  <td className="cell-lead"><strong>{t.name}</strong></td>
                  <td className="muted" data-label="City">{t.city}</td>
                  <td className="muted" data-label="Owner">{t.ownerName}</td>
                  <td data-label="Status">
                    <span
                      className={`badge ${
                        t.approved ? 'badge-success' : t.rejected ? 'badge-danger' : 'badge-warning'
                      }`}
                      title={t.rejected ? t.rejectionReason : undefined}
                    >
                      {t.approved ? 'Approved' : t.rejected ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td className="cell-actions">
                    <div className="row-actions">
                      {!t.approved ? (
                        <>
                          <button
                            className="btn btn-sm"
                            disabled={busyId === t.id}
                            onClick={() => handleApprove(t.id)}
                          >
                            {t.rejected ? 'Approve anyway' : 'Approve'}
                          </button>
                          {!t.rejected && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => {
                                setRejectError('');
                                setRejectTarget(t);
                              }}
                            >
                              Reject
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openDelete(t)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReasonDialog
        open={Boolean(rejectTarget)}
        name={rejectTarget?.name}
        title={`Reject ${rejectTarget?.name}?`}
        description="The owner sees this note on the theatre in their dashboard. The registration is then removed automatically a few minutes after they've read it."
        presets={[
          'Address could not be verified at the given city or pincode',
          'Contact phone is missing or unreachable',
          'Duplicate registration for a theatre already listed',
          'Venue does not meet CineSphere listing requirements',
        ]}
        placeholder="Tell the owner why this registration was turned down…"
        confirmLabel="Reject registration"
        busy={rejecting}
        error={rejectError}
        onCancel={() => {
          setRejectTarget(null);
          setRejectError('');
        }}
        onConfirm={handleReject}
      />

      <DeleteDialog
        open={Boolean(target)}
        name={target?.name}
        title={`Delete ${target?.name || 'theatre'}?`}
        description="This permanently removes the theatre and everything under it. It cannot be undone."
        consequences={[
          'All its screens and seat layouts are removed',
          'All shows scheduled there are removed',
        ]}
        impact={impact}
        impactLoading={impactLoading}
        note={note}
        onNoteChange={setNote}
        confirmLabel="Delete theatre"
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
