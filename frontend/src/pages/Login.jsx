import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import ErrorMessage from '../components/ErrorMessage';
import { apiErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const auth = await login(email, password);
      const from = location.state?.from;
      if (from) {
        navigate(from);
      } else if (auth.role === 'ADMIN') {
        navigate('/admin');
      } else if (auth.role === 'THEATRE_OWNER') {
        navigate('/owner');
      } else if (auth.role === 'MOVIE_CREATOR') {
        navigate('/creator');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Pick a seat, hold it for five minutes, and walk in with your ticket. Everything you've booked stays in one place."
      highlights={[
        'Live seat maps with real-time availability',
        'Your tickets and refunds in one history',
        'Showtimes near you across every theatre',
      ]}
      formTitle="Log in"
      footer={
        <span>
          No account? <Link to="/register">Sign up</Link>
        </span>
      }
    >
      <ErrorMessage message={error} />
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
