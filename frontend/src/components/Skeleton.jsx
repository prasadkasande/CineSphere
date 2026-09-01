import './Skeleton.css';

export function Skeleton({ width, height, radius, style }) {
  return (
    <span
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="skel-movie-card" aria-hidden="true">
      <Skeleton height="100%" radius="var(--radius)" style={{ aspectRatio: '2 / 3', display: 'block' }} />
      <Skeleton height="13px" width="75%" style={{ marginTop: 10 }} />
      <Skeleton height="11px" width="50%" style={{ marginTop: 6 }} />
    </div>
  );
}

export function MovieGridSkeleton({ count = 6 }) {
  return (
    <div className="grid movie-grid">
      {Array.from({ length: count }, (_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="skel-table" aria-hidden="true">
      {Array.from({ length: rows }, (_, r) => (
        <div className="skel-table-row" key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} height="13px" width={c === 0 ? '80%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }) {
  return (
    <div className="grid stat-grid">
      {Array.from({ length: count }, (_, i) => (
        <div className="card" key={i}>
          <Skeleton height="11px" width="55%" />
          <Skeleton height="26px" width="40%" style={{ marginTop: 12 }} />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
