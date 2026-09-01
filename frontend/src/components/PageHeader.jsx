import { useAuth } from '../context/AuthContext';
import './PageHeader.css';

/** "Priya Sharma" -> "Priya". Falls back to the whole string for one-word names. */
function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || '';
}

/**
 * Greets whoever is signed in, then states what the page is for.
 *
 * Every dashboard previously opened with the same anonymous "Admin Dashboard" /
 * "Creator Studio" heading regardless of who was looking at it. The greeting is
 * the personal half; `title` stays the page's actual name so the header still
 * says where you are.
 */
export default function PageHeader({ title, subtitle, actions, children }) {
  const { user } = useAuth();
  const greeting = user ? `${timeGreeting()}, ${firstName(user.name)}` : null;

  return (
    <header className="page-header">
      <div className="page-header-main">
        {greeting && (
          <p className="page-greeting">
            {greeting}
            <span className="page-greeting-wave" aria-hidden="true">
              👋
            </span>
          </p>
        )}
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-sub muted">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
