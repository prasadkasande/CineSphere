import { useEffect, useMemo, useState } from 'react';
import { TableSkeleton } from '../../components/Skeleton';
import ErrorMessage from '../../components/ErrorMessage';
import DeleteDialog from '../../components/DeleteDialog';
import ReasonDialog from '../../components/ReasonDialog';
import {
  activateUser,
  approveUser,
  deleteUser,
  getAllUsers,
  getPendingUsers,
  getUserDeletionImpact,
  rejectUser,
  suspendUser,
} from '../../api/admin';
import { Pagination, usePagination } from '../../components/Pagination';
import { apiErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './AdminUsersTab.css';

const ROLE_CONSEQUENCES = {
  THEATRE_OWNER: [
    'Their theatres, screens and seat layouts are removed',
    'All shows scheduled at those theatres are removed',
  ],
  MOVIE_CREATOR: [
    'Every movie they posted is removed',
    'All shows scheduled against those movies are removed',
  ],
  CUSTOMER: ['Their booking history is removed'],
};

const ROLES = ['ALL', 'CUSTOMER', 'THEATRE_OWNER', 'MOVIE_CREATOR', 'ADMIN'];
const STATUSES = ['ALL', 'Active', 'Suspended', 'Pending approval', 'Rejected'];

/** One source of truth for a user's status - the badge and filter share it. */
function statusOf(u) {
  if (u.rejected) return 'Rejected';
  if (!u.approved) return 'Pending approval';
  return u.enabled ? 'Active' : 'Suspended';
}

export default function AdminUsersTab() {
  const toast = useToast();
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
  const [rejectError, setRejectError] = useState('');
  const [rejecting, setRejecting] = useState(false);

  /** Search and filters narrow the list; pagination bounds what renders. */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && statusOf(u) !== statusFilter) return false;
      if (!term) return true;
      return `${u.name} ${u.email}`.toLowerCase().includes(term);
    });
  }, [users, search, roleFilter, statusFilter]);

  const paged = usePagination(filtered, 10);

  function load() {
    setLoading(true);
    Promise.all([getAllUsers(), getPendingUsers()])
      .then(([allUsers, pendingUsers]) => {
        setUsers(allUsers);
        setPending(pendingUsers);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggle(user) {
    setBusyId(user.id);
    setError('');
    try {
      await (user.enabled ? suspendUser(user.id) : activateUser(user.id));
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleApprove(id) {
    setError('');
    try {
      await approveUser(id);
      load();
      toast.success('Application approved.');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleReject(reason) {
    setRejecting(true);
    setRejectError('');
    try {
      await rejectUser(rejectTarget.id, reason);
      const applicant = rejectTarget.name;
      setRejectTarget(null);
      load();
      toast.success(`${applicant} was rejected and notified.`);
    } catch (err) {
      setRejectError(apiErrorMessage(err));
    } finally {
      setRejecting(false);
    }
  }

  /** Load the refund/impact preview as the delete dialog opens. */
  function openDelete(user) {
    setDialogError('');
    setNote('');
    setImpact(null);
    setTarget(user);
    setImpactLoading(true);
    getUserDeletionImpact(user.id)
      .then(setImpact)
      .catch(() => {})
      .finally(() => setImpactLoading(false));
  }

  async function confirmDelete() {
    setDeleting(true);
    setDialogError('');
    try {
      await deleteUser(target.id, note);
      const name = target.name;
      setTarget(null);
      load();
      toast.success(`${name} deleted.`);
    } catch (err) {
      // Keep the dialog open so the admin can read why it was refused.
      setDialogError(apiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <TableSkeleton />;

  return (
    <div>
      <ErrorMessage message={error} />

      <section className="section">
        <div className="section-head">
          <h2 style={{ marginTop: 0 }}>Business applications</h2>
          <span className="badge badge-muted">{pending.length}</span>
        </div>
        <p className="muted section-hint">
          Theatre Owners and Movie Creators apply via the CineSphere Business page — approve or
          reject them here.
        </p>

        {pending.length === 0 ? (
          <div className="empty-state">No pending applications.</div>
        ) : (
          <div className="grid stagger" style={{ gap: 12 }}>
            {pending.map((u) => (
              <div key={u.id} className="card pending-card">
                <div>
                  <strong>{u.name}</strong>
                  <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                    {u.email}
                  </p>
                </div>
                <div className="pending-actions">
                  <span className="badge badge-accent">{u.role.replace('_', ' ')}</span>
                  <button className="btn btn-sm" onClick={() => handleApprove(u.id)}>
                    Approve
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {
                      setRejectError('');
                      setRejectTarget(u);
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section users-section">
        <div className="section-head">
          <h2>All users</h2>
          <span className="badge badge-muted">{users.length}</span>
        </div>

        <div className="users-toolbar">
          <div className="search-box users-search">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users"
            />
          </div>

          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All roles' : r.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st === 'ALL' ? 'All statuses' : st}
              </option>
            ))}
          </select>

          {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('');
                setRoleFilter('ALL');
                setStatusFilter('ALL');
              }}
            >
              Clear
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">No users match those filters.</div>
        ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.slice.map((u) => {
                const isSelf = currentAdmin && u.id === currentAdmin.userId;
                return (
                  <tr key={u.id}>
                    <td className="cell-lead">
                      <strong>{u.name}</strong>
                      {isSelf && <span className="badge badge-muted self-tag">You</span>}
                    </td>
                    <td className="muted cell-wide" data-label="Email">{u.email}</td>
                    <td data-label="Role">
                      <span className="badge badge-muted">{u.role.replace('_', ' ')}</span>
                    </td>
                    <td data-label="Status">
                      {(() => {
                        const status = statusOf(u);
                        const tone = {
                          Rejected: 'badge-danger',
                          'Pending approval': 'badge-warning',
                          Active: 'badge-success',
                          Suspended: 'badge-danger',
                        }[status];
                        return (
                          <span className={`badge ${tone}`} title={u.rejected ? u.rejectionReason : undefined}>
                            {status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="cell-actions">
                      {!isSelf && u.role !== 'ADMIN' && (
                        <div className="row-actions">
                          {u.approved && (
                            <button
                              className={`btn btn-sm ${u.enabled ? 'btn-secondary' : ''}`}
                              disabled={busyId === u.id}
                              onClick={() => toggle(u)}
                            >
                              {u.enabled ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => openDelete(u)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
        <Pagination state={paged} noun="users" />
      </section>

      <DeleteDialog
        open={Boolean(target)}
        name={target?.name}
        title={`Delete ${target?.name || 'user'}?`}
        description="This permanently removes the account and everything it owns. It cannot be undone."
        consequences={target ? ROLE_CONSEQUENCES[target.role] || [] : []}
        impact={impact}
        impactLoading={impactLoading}
        note={note}
        onNoteChange={setNote}
        confirmLabel="Delete account"
        busy={deleting}
        error={dialogError}
        onCancel={() => {
          setTarget(null);
          setDialogError('');
        }}
        onConfirm={confirmDelete}
      />

      <ReasonDialog
        open={Boolean(rejectTarget)}
        name={rejectTarget?.name}
        busy={rejecting}
        error={rejectError}
        onCancel={() => {
          setRejectTarget(null);
          setRejectError('');
        }}
        onConfirm={handleReject}
      />
    </div>
  );
}
