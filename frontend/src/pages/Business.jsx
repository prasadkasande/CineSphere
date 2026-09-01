import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import ErrorMessage from '../components/ErrorMessage';
import { registerBusiness } from '../api/auth';
import { apiErrorMessage } from '../api/client';

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'THEATRE_OWNER' };

export default function Business() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await registerBusiness(form);
      setSubmitted(result);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Application submitted."
        subtitle="An admin reviews every application before the account goes live. You'll be able to log in as soon as it's approved."
        highlights={[
          'Reviews usually happen within a day',
          "You'll see the decision on your next login attempt",
          'Rejected applications come with a reason',
        ]}
        formTitle="You're in the queue"
      >
        <div className="alert alert-success">{submitted.message}</div>
        <Link to="/login" className="btn btn-block" style={{ marginTop: 16 }}>
          Back to login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="CineSphere for Business."
      subtitle="List your theatre and sell tickets, or post movies for theatres to screen. Submit your details and an admin will review the application before your account goes live."
      highlights={[
        'Programme screens with one-off or recurring shows',
        'Track revenue, seats sold and occupancy per theatre',
        'Creators post once and reach every theatre on CineSphere',
      ]}
      formTitle="Apply for a business account"
      formSubtitle="Reviewed by an admin before it goes live."
      footer={
        <span>
          Just want to book tickets? <Link to="/register">Sign up as a moviegoer</Link>
        </span>
      }
    >
      <ErrorMessage message={error} />
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="biz-role">I want to…</label>
          <select id="biz-role" value={form.role} onChange={(e) => update('role', e.target.value)}>
            <option value="THEATRE_OWNER">List a theatre &amp; sell tickets</option>
            <option value="MOVIE_CREATOR">Post movies for theatres to screen</option>
          </select>
        </div>

        <div className="auth-fields-2">
          <div className="field">
            <label htmlFor="biz-name">Business / contact name</label>
            <input
              id="biz-name"
              autoComplete="organization"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="biz-email">Email</label>
            <input
              id="biz-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="biz-password">Password</label>
            <input
              id="biz-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="biz-phone">Phone (optional)</label>
            <input
              id="biz-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </AuthLayout>
  );
}
