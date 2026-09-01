import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const DASHBOARDS = {
  CUSTOMER: { to: '/my-bookings', label: 'My Bookings' },
  THEATRE_OWNER: { to: '/owner', label: 'Owner Dashboard' },
  MOVIE_CREATOR: { to: '/creator', label: 'Creator Studio' },
  ADMIN: { to: '/admin', label: 'Admin Dashboard' },
};

const ROLE_LABEL = {
  CUSTOMER: 'Moviegoer',
  THEATRE_OWNER: 'Theatre owner',
  MOVIE_CREATOR: 'Movie creator',
  ADMIN: 'Administrator',
};

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // A route change should never leave the menu hanging open.
  useEffect(() => setOpen(false), [location.pathname]);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/');
  }

  const dashboard = user ? DASHBOARDS[user.role] : null;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" aria-label="CineSphere home">
          <svg viewBox="0 0 32 32" className="brand-mark" aria-hidden="true">
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <circle cx="16" cy="16" r="4.6" fill="currentColor" />
          </svg>
          <span>
            Cine<span className="brand-accent">Sphere</span>
          </span>
        </Link>

        <nav className="navbar-links" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
            Movies
          </NavLink>
          {dashboard && (
            <NavLink
              to={dashboard.to}
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              {dashboard.label}
            </NavLink>
          )}
        </nav>

        <div className="navbar-right">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          {user ? (
            <div className="avatar-menu" ref={menuRef}>
              <button
                type="button"
                className={`avatar-btn ${open ? 'is-open' : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Account menu"
              >
                <span className="avatar-initials">{initials(user.name)}</span>
                <span className="avatar-caret" aria-hidden="true">⌄</span>
              </button>

              {open && (
                <div className="avatar-dropdown" role="menu">
                  <div className="avatar-dropdown-head">
                    <span className="avatar-initials avatar-initials-lg">{initials(user.name)}</span>
                    <div className="avatar-identity">
                      <strong>{user.name}</strong>
                      <span className="dim">{user.email}</span>
                      <span className="avatar-role">{ROLE_LABEL[user.role] || user.role}</span>
                    </div>
                  </div>

                  {dashboard && (
                    <Link to={dashboard.to} className="avatar-item" role="menuitem">
                      {dashboard.label}
                    </Link>
                  )}
                  {user.role !== 'CUSTOMER' && (
                    <Link to="/" className="avatar-item" role="menuitem">
                      Browse movies
                    </Link>
                  )}

                  <button type="button" className="avatar-item" role="menuitem" onClick={toggleTheme}>
                    <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                    <span className="avatar-item-icon">{theme === 'dark' ? '☀' : '☾'}</span>
                  </button>

                  <button
                    type="button"
                    className="avatar-item avatar-item-danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
