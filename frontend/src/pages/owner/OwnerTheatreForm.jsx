import ErrorMessage from '../../components/ErrorMessage';
import './OwnerTheatreForm.css';

/**
 * One form for both registering a new theatre and editing an existing one -
 * the fields are identical, only the wording and the outcome differ.
 */
const COPY = {
  register: {
    title: 'Register a new theatre',
    sub: 'Goes to an admin for approval before it can host shows.',
    submit: 'Submit for approval',
  },
  edit: {
    title: 'Edit theatre',
    sub: 'Details customers and admins see. Editing never affects an approved theatre’s status.',
    submit: 'Save changes',
  },
  resubmit: {
    title: 'Edit & resend for approval',
    sub: 'This files a fresh application with the corrected details. The rejected registration is removed, and any screens you laid out move across.',
    submit: 'Resend for approval',
  },
};

export default function OwnerTheatreForm({ mode, form, onChange, submitting, error, onSubmit, onCancel }) {
  const copy = COPY[mode] || COPY.register;
  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });

  return (
    <div className="card register-form">
      <div className="theatre-form-head">
        <div>
          <h3 className="theatre-form-title">{copy.title}</h3>
          <p className="muted theatre-form-sub">{copy.sub}</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={onSubmit}>
        <div className="register-split">
          <section className="register-group">
            <h4 className="register-legend">Where it is</h4>

            <div className="register-grid">
              <div className="field">
                <label htmlFor="th-name">Theatre name</label>
                <input
                  id="th-name"
                  required
                  placeholder="e.g. Skyline Cinemas"
                  value={form.name}
                  onChange={set('name')}
                />
              </div>
              <div className="field">
                <label htmlFor="th-city">City</label>
                <input
                  id="th-city"
                  required
                  placeholder="e.g. Springfield"
                  value={form.city}
                  onChange={set('city')}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="th-address">Street address</label>
              <input
                id="th-address"
                required
                placeholder="e.g. 221 Main Street"
                value={form.address}
                onChange={set('address')}
              />
            </div>
          </section>

          <section className="register-group">
            <h4 className="register-legend">How to reach you</h4>

            <div className="register-grid">
              <div className="field">
                <label htmlFor="th-phone">Contact phone</label>
                <input
                  id="th-phone"
                  type="tel"
                  placeholder="e.g. +1 555 0100"
                  value={form.phone}
                  onChange={set('phone')}
                />
              </div>
              <div className="field">
                <label htmlFor="th-pincode">Pincode / postal code</label>
                <input
                  id="th-pincode"
                  placeholder="e.g. 62704"
                  value={form.pincode}
                  onChange={set('pincode')}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="th-description">Description &amp; amenities (optional)</label>
              <textarea
                id="th-description"
                rows={3}
                maxLength={300}
                placeholder="Screens, parking, food court, accessibility, sound format…"
                value={form.description}
                onChange={set('description')}
              />
              <span className="register-hint">{(form.description || '').length}/300</span>
            </div>

            <button className="btn btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : copy.submit}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}
