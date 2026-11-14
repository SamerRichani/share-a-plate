import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
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
      await login(values);
      navigate(location.state?.from?.pathname || '/offers', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page page-shell" id="main-content">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">Welcome back</p>
        <h1 id="login-title">Good to see you.</h1>
        <p className="auth-card__intro">
          Sign in to find food, manage an offer, or pick up where you left off.
        </p>
        {location.state?.message && (
          <div className="alert alert--success" role="status">
            {location.state.message}
          </div>
        )}
        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}
        <form className="stack-form" onSubmit={submit}>
          <TextField
            autoComplete="email"
            id="email"
            label="Email"
            name="email"
            required
            type="email"
            value={values.email}
            onChange={update}
          />
          <TextField
            autoComplete="current-password"
            id="password"
            label="Password"
            name="password"
            required
            type="password"
            value={values.password}
            onChange={update}
          />
          <Button className="button--wide" disabled={submitting} type="submit">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="auth-card__switch">
          New around here? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
