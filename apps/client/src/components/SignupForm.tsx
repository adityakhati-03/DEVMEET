import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import DevMeetLogo from './DevMeetLogo';
import { useAuth } from '../context/AuthContext';
import OAuthButtons from './auth/OAuthButtons';
import './auth.css';

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  hint?: string;
  value: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  fieldError?: string;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  id, label, type = 'text', placeholder, hint, value,
  showPassword, onTogglePassword, fieldError, loading, onChange,
}: FieldProps) {
  const isPassword = id === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="auth-field">
      <label className="dm-label" htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <input
          id={id}
          name={id}
          type={resolvedType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          disabled={loading}
          className={`dm-input${isPassword ? ' auth-password-input' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-eye-btn"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword
              ? <EyeOff size={16} strokeWidth={2} />
              : <Eye size={16} strokeWidth={2} />}
          </button>
        )}
      </div>
      {fieldError
        ? <p className="auth-field-error">{fieldError}</p>
        : hint
          ? <p className="auth-field-hint">{hint}</p>
          : null}
    </div>
  );
}

export default function SignupForm() {
  const [form, setForm] = useState({ name: '', email: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const result = await signup(form);
      navigate(`/verify?username=${encodeURIComponent(result.username)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
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
            <DevMeetLogo size={32} />
          </div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join DevMeet and start coding together</p>
        </div>

        {/* Card */}
        <div className="dm-glass auth-card">
          <OAuthButtons />
          <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: '16px' }}>
            {/* Name + Username row */}
            <div className="dm-grid-2">
              <Field
                id="name" label="Full Name" placeholder="Jane Doe"
                value={form.name} loading={loading} onChange={handleChange}
                fieldError={fieldErrors.name}
              />
              <Field
                id="username" label="Username" placeholder="janedoe"
                value={form.username} loading={loading} onChange={handleChange}
                fieldError={fieldErrors.username}
              />
            </div>

            {/* Email */}
            <Field
              id="email" label="Email" type="email" placeholder="you@example.com"
              value={form.email} loading={loading} onChange={handleChange}
              fieldError={fieldErrors.email}
            />


            {/* Error */}
            {error && <div className="dm-error-box">{error}</div>}

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              className="dm-btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>

            {/* Sign-in link */}
            <p className="auth-switch-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">Sign in</Link>
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}
