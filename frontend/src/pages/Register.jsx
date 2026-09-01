import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import ErrorMessage from '../components/ErrorMessage';
import { apiErrorMessage } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({ ...form, role: 'CUSTOMER' });
      navigate('/');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Your seat is waiting."
      subtitle="Create an account to book tickets, hold seats while you decide, and keep every booking and refund in one history."
      highlights={[
        'Book in a few clicks — no card details stored',
        'Seats held for five minutes while you check out',
        'Cancel and see refunds against your account',
      ]}
      formTitle="Create an account"
      formSubtitle="Free, and takes about a minute."
      footer={
        <>
          <span>
            Already have an account? <Link to="/login">Log in</Link>
          </span>
          <span>
            Listing a theatre or posting movies?{' '}
            <Link to="/business">Apply on CineSphere Business</Link>
          </span>
        </>
      }
    >
      <ErrorMessage message={error} />
      <form onSubmit={handleSubmit}>
        <div className="auth-fields-2">
          <div className="field">
            <label htmlFor="reg-fullname">Full name</label>
            <input
              id="reg-fullname"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-phone">Phone (optional)</label>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </AuthLayout>
  );
}
