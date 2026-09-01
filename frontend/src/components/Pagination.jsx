import { useEffect, useMemo, useState } from 'react';
import './Pagination.css';

/**
 * Slices a list into pages and keeps the current page valid.
 *
 * Capping a list with "show all" stops helping once it is genuinely long -
 * expanding just restores the scroll. Pages keep the visible cost constant
 * however far the data grows.
 */
export function usePagination(items, perPage = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  // Filtering or deleting can strand you past the end - step back rather than
  // render an empty page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return useMemo(() => {
    const current = Math.min(page, totalPages);
    const start = (current - 1) * perPage;
    return {
      page: current,
      setPage,
      totalPages,
      total: items.length,
      slice: items.slice(start, start + perPage),
      from: items.length === 0 ? 0 : start + 1,
      to: Math.min(start + perPage, items.length),
      // Reset to the first page whenever the underlying filter changes.
      reset: () => setPage(1),
    };
  }, [items, page, perPage, totalPages]);
}

/** Page numbers around the current one, with gaps elided. */
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const out = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) out.push(`gap-${p}`);
    out.push(p);
    previous = p;
  }
  return out;
}

export function Pagination({ state, noun = 'results' }) {
  const { page, setPage, totalPages, total, from, to } = state;
  if (total === 0) return null;

  return (
    <div className="pager">
      <span className="pager-count">
        Showing <strong>{from}–{to}</strong> of {total} {noun}
      </span>

      {totalPages > 1 && (
        <nav className="pager-nav" aria-label="Pagination">
          <button
            type="button"
            className="pager-step"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            ‹
          </button>

          {pageList(page, totalPages).map((p) =>
            typeof p === 'number' ? (
              <button
                key={p}
                type="button"
                className={`pager-page ${p === page ? 'is-current' : ''}`}
                onClick={() => setPage(p)}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            ) : (
              <span key={p} className="pager-gap" aria-hidden="true">
                …
              </span>
            ),
          )}

          <button
            type="button"
            className="pager-step"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  );
}
