import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          Cine<span className="brand-accent">Sphere</span>
        </div>

        <nav className="footer-links">
          <Link to="/">Movies</Link>
          <Link to="/business">For Business</Link>
          <Link to="/register">Sign up</Link>
        </nav>

        <p className="footer-note dim">
          Demo project · mock payments · no real transactions are processed.
        </p>
      </div>
    </footer>
  );
}
