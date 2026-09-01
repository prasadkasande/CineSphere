import { useEffect, useState } from 'react';
import AdminTheatresTab from './AdminTheatresTab';
import AdminMoviesTab from './AdminMoviesTab';
import AdminUsersTab from './AdminUsersTab';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { StatGridSkeleton } from '../../components/Skeleton';
import { getAdminStats } from '../../api/admin';

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'theatres', label: 'Theatres' },
  { key: 'movies', label: 'Movies' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {});
  }, []);

  const pending = stats
    ? stats.pendingUserCount + stats.pendingTheatreCount + stats.pendingMovieCount
    : 0;

  return (
    <div className="container page">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform health, approvals and catalogue moderation."
      />

      {stats ? (
        <div className="grid stat-grid stagger">
          <StatCard
            label="Platform revenue"
            value={`$${Number(stats.platformRevenue).toFixed(2)}`}
            accent
            hint={`${stats.bookingCount} confirmed bookings`}
          />
          <StatCard
            label="Pending approvals"
            value={pending}
            hint={`${stats.pendingMovieCount} movies · ${stats.pendingUserCount} business · ${stats.pendingTheatreCount} theatres`}
          />
          <StatCard label="Users" value={stats.userCount} hint={`${stats.customerCount} moviegoers`} />
          <StatCard label="Catalogue" value={stats.movieCount} hint={`${stats.theatreCount} theatres listed`} />
        </div>
      ) : (
        <StatGridSkeleton />
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === 'users' && stats?.pendingUserCount > 0 && (
              <span className="tab-dot" aria-label={`${stats.pendingUserCount} pending`} />
            )}
            {t.key === 'theatres' && stats?.pendingTheatreCount > 0 && (
              <span className="tab-dot" aria-label={`${stats.pendingTheatreCount} pending`} />
            )}
            {t.key === 'movies' && stats?.pendingMovieCount > 0 && (
              <span className="tab-dot" aria-label={`${stats.pendingMovieCount} pending`} />
            )}
          </div>
        ))}
      </div>

      {tab === 'users' && <AdminUsersTab />}
      {tab === 'theatres' && <AdminTheatresTab />}
      {tab === 'movies' && <AdminMoviesTab />}
    </div>
  );
}
