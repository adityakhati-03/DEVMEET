import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ identifier, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* subtle dot-grid background */}
      <div className="auth-bg-pattern" aria-hidden="true" />
      <div className="auth-glow-top"    aria-hidden="true" />
      <div className="auth-glow-bottom" aria-hidden="true" />

      <div className="auth-container animate-slide-up">
        {/* Logo / icon */}
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <Zap className="auth-logo-icon" size={22} strokeWidth={2} />
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your DevMeet account</p>
        </div>

        {/* Card */}
        <div className="dm-glass auth-card">
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email / Username */}
            <div className="auth-field">
              <label className="dm-label" htmlFor="login-identifier">
                Email or Username
              </label>
              <input
                id="login-identifier"
                className="dm-input"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="auth-field-header">
                <label className="dm-label" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="auth-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <div className="auth-input-wrap">
                <input
                  id="login-password"
                  className="dm-input auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff size={16} strokeWidth={2} />
                    : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="dm-error-box">{error}</div>}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className="dm-btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>

            {/* Sign-up link */}
            <p className="auth-switch-text">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="auth-switch-link">Create one</Link>
            </p>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-label">OR</span>
            <div className="auth-divider-line" />
          </div>

          {/* Social — Phase 2 */}
          <div className="auth-social-placeholder">
            🔒 Social login (Google / GitHub) coming in Phase 2
          </div>
        </div>
      </div>
    </div>
  );
}
