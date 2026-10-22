import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { user, loading, login, register } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/teams';
  if (!loading && user) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(username, email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unexpected error');
      setBusy(false);
    }
  }

  const isLogin = mode === 'login';
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-prompt">$</span> devops-planner
        </div>
        <p className="auth-sub">{isLogin ? 'Sign in to your team boards' : 'Create an account to start planning'}</p>
        <form onSubmit={submit} className="form">
          {!isLogin && (
            <label>
              Username
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={32}
                required
                autoComplete="username"
              />
            </label>
          )}
          <label>
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isLogin ? undefined : 6}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? (
            <>
              No account? <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              Already registered? <Link to="/login">Sign in</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export const LoginPage = () => <AuthForm mode="login" />;
export const RegisterPage = () => <AuthForm mode="register" />;
