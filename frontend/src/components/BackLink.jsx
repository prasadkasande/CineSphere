import { useNavigate } from 'react-router-dom';
import './BackLink.css';

/**
 * Back navigation for sub-pages. Prefers an explicit `to` so the destination is
 * predictable, and falls back to browser history when there isn't a single
 * obvious parent.
 */
export default function BackLink({ to, label = 'Back' }) {
  const navigate = useNavigate();

  function handleClick() {
    if (to) navigate(to);
    else navigate(-1);
  }

  return (
    <button type="button" className="back-link" onClick={handleClick}>
      <span className="back-link-arrow" aria-hidden="true">←</span>
      {label}
    </button>
  );
}
