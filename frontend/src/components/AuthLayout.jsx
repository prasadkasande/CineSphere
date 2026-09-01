import { Link } from 'react-router-dom';
import './AuthLayout.css';

/**
 * Wide two-panel shell for the signed-out pages (log in, sign up, business
 * application).
 *
 * These used to be a 420px card centred in a 1240px container, which left most
 * of a desktop screen empty. Simply widening that card isn't the fix
 * - a text input stretched across 900px reads as broken - so the width is
 * filled with a pitch panel beside the form instead, and the form itself keeps
 * a comfortable measure.
 */
export default function AuthLayout({
  title,
  subtitle,
  highlights = [],
  aside,
  formTitle,
  formSubtitle,
  children,
  footer,
}) {
  return (
    <div className="container page">
      <div className="auth-split">
        <section className="auth-pitch">
          <Link to="/" className="auth-brand">
            <svg viewBox="0 0 32 32" className="auth-brand-mark" aria-hidden="true">
              <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.4" />
              <circle cx="16" cy="16" r="4.6" fill="currentColor" />
            </svg>
            <span>
              Cine<span className="brand-accent">Sphere</span>
            </span>
          </Link>

          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}

          {highlights.length > 0 && (
            <ul className="auth-points">
              {highlights.map((point) => (
                <li key={point}>
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      d="M3.5 8.4l3 3 6-6.8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          )}

          {aside && <div className="auth-aside">{aside}</div>}
        </section>

        <section className="auth-panel">
          <div className="card auth-card">
            {formTitle && <h2 className="auth-card-title">{formTitle}</h2>}
            {formSubtitle && <p className="auth-card-sub muted">{formSubtitle}</p>}
            {children}
            {footer && <div className="auth-footer">{footer}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
