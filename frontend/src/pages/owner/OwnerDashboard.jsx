import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import OwnerTheatresTab from './OwnerTheatresTab';
import OwnerScreensTab from './OwnerScreensTab';
import OwnerShowsTab from './OwnerShowsTab';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { StatGridSkeleton } from '../../components/Skeleton';
import { getOwnerStats } from '../../api/owner';

const TABS = [
  { key: 'shows', label: 'Shows' },
  { key: 'theatres', label: 'Theatres' },
  { key: 'screens', label: 'Screens' },
];

export default function OwnerDashboard() {
  const location = useLocation();
  // Arriving from a catalogue card's "Schedule this" - land on Shows with that
  // title already chosen in the scheduler.
  const scheduleMovieId = location.state?.scheduleMovieId ?? null;

  const [tab, setTab] = useState('shows');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getOwnerStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="container page">
      <PageHeader
        title="Theatre Owner Dashboard"
        subtitle="Programme your screens and track how your shows are performing."
      />

      {stats ? (
        <div className="grid stat-grid stagger">
          <StatCard label="Revenue" value={`$${Number(stats.revenue).toFixed(2)}`} accent hint="Confirmed bookings" />
          <StatCard label="Seats sold" value={stats.seatsSold} hint={`${stats.occupancyRate}% occupancy`} />
          <StatCard label="Upcoming shows" value={stats.upcomingShowCount} hint={`${stats.totalShowCount} all time`} />
          <StatCard
            label="Theatres"
            value={stats.theatreCount}
            hint={`${stats.approvedTheatreCount} approved · ${stats.screenCount} screens`}
          />
        </div>
      ) : (
        <StatGridSkeleton />
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'shows' && <OwnerShowsTab initialMovieId={scheduleMovieId} />}
      {tab === 'theatres' && <OwnerTheatresTab />}
      {tab === 'screens' && <OwnerScreensTab />}
    </div>
  );
}
