import './StatCard.css';

export default function StatCard({ label, value, hint, accent = false }) {
  return (
    <div className={`stat-card ${accent ? 'stat-card-accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}
