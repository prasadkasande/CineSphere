import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroRotator.css';

const INTERVAL_MS = 7000;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Admin-curated featured movies, cross-fading one into the next. All slides
 * stay mounted and stacked so the poster backdrops can dissolve between each
 * other rather than pop.
 */
export default function HeroRotator({ movies }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const count = movies.length;

  const goTo = useCallback(
    (next) => setIndex(((next % count) + count) % count),
    [count]
  );

  // Auto-advance, unless paused, single-slide, or the user asked for less motion.
  useEffect(() => {
    if (count <= 1 || paused || prefersReducedMotion()) return undefined;
    timerRef.current = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timerRef.current);
  }, [index, paused, count]);

  // Keep the index valid if the featured list shrinks.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  const active = movies[index];

  return (
    <section
      className="hero-rotator"
      aria-roledescription="carousel"
      aria-label="Featured movies"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Stacked backdrops - only the active one is opaque. */}
      <div className="hero-backdrops" aria-hidden="true">
        {movies.map((m, i) => (
          <div
            key={m.id}
            className={`hero-backdrop ${i === index ? 'is-active' : ''}`}
            style={{ backgroundImage: `url(${m.coverImageUrl})` }}
          />
        ))}
      </div>

      <div className="hero-scrim" aria-hidden="true" />

      <div className="container hero-body">
        {/* key on the movie id so the copy re-animates on every change */}
        <div className="hero-copy" key={active.id}>
          <span className="hero-eyebrow">Featured</span>
          <h1 className="hero-title">{active.title}</h1>
          <p className="hero-meta">
            {[
              active.genre,
              active.language,
              active.durationMins && `${active.durationMins} min`,
              active.censorRating,
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </p>
          {active.description && <p className="hero-desc">{active.description}</p>}
          <div className="hero-actions">
            <Link to={`/movies/${active.id}`} className="btn btn-lg">
              Book tickets
            </Link>
          </div>
        </div>

        {count > 1 && (
          <div className="hero-dots" role="tablist" aria-label="Choose featured movie">
            {movies.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={m.title}
                className={`hero-dot ${i === index ? 'is-active' : ''}`}
                onClick={() => goTo(i)}
              >
                <span
                  className="hero-dot-fill"
                  style={{
                    animationDuration: `${INTERVAL_MS}ms`,
                    animationPlayState: i === index && !paused ? 'running' : 'paused',
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
