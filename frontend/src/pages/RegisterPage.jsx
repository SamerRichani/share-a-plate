import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    role: 'recipient',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(values);
      navigate('/login', {
        replace: true,
        state: { message: 'Your account is ready. Sign in to get started.' },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page page-shell" id="main-content">
      <section className="auth-card" aria-labelledby="register-title">
        <p className="eyebrow">Make good things happen</p>
        <h1 id="register-title">Join the table.</h1>
        <p className="auth-card__intro">
          Create an account to find or share food in your neighborhood.
        </p>
        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}
        <form className="stack-form" onSubmit={submit}>
          <TextField
            autoComplete="name"
            id="name"
            label="Your name"
            maxLength={100}
            name="name"
            required
            value={values.name}
            onChange={update}
          />
          <TextField
            autoComplete="email"
            id="email"
            label="Email"
            maxLength={254}
            name="email"
            required
            type="email"
            value={values.email}
            onChange={update}
          />
          <TextField
            autoComplete="new-password"
            id="password"
            label="Password"
            minLength={12}
            name="password"
            hint="Use at least 12 characters."
            required
            type="password"
            value={values.password}
            onChange={update}
          />
          <fieldset className="role-choice">
            <legend className="field__label">I’m here to…</legend>
            <label className="role-choice__option">
              <input
                checked={values.role === 'recipient'}
                name="role"
                onChange={update}
                type="radio"
                value="recipient"
              />
              <span>
                <strong>Find food</strong>
                <small>Reserve portions from local offers.</small>
              </span>
            </label>
            <label className="role-choice__option">
              <input
                checked={values.role === 'donor'}
                name="role"
                onChange={update}
                type="radio"
                value="donor"
              />
              <span>
                <strong>Share food</strong>
                <small>Post surplus food for the community.</small>
              </span>
            </label>
          </fieldset>
          <Button className="button--wide" disabled={submitting} type="submit">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className="auth-card__switch">
          Already a member? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
