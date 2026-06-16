import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { authService } from '../services/authService';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { setUser } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Username is passed via query param: /verify?username=johndoe
  const username = decodeURIComponent(searchParams.get('username') ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await authService.completeSignup(username, code, password);
      setSuccessMsg(result.message || 'Account activated! Redirecting...');
      setTimeout(() => {
        // Force reload to get me() state or just redirect since the token is set
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Incorrect verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div style={{ background: 'var(--dm-card)', border: '1px solid var(--dm-border)', borderRadius: '12px', padding: '32px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <MailCheck style={{ width: '22px', height: '22px', color: '#34d399' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--dm-text)', margin: 0, textAlign: 'center' }}>Check your inbox</h1>
            <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '6px 0 0', fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>
              We&apos;ve sent a 6-digit verification code to the email associated with <strong style={{ color: 'var(--dm-text)' }}>@{username}</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--dm-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Verification Code
              </label>
              <input
                name="code" type="text" placeholder="123456" maxLength={6} required disabled={loading}
                value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                style={{ width: '100%', background: 'var(--dm-input)', border: '1px solid var(--dm-border)', borderRadius: '8px', padding: '14px', fontSize: '20px', fontWeight: 800, letterSpacing: '0.5em', textAlign: 'center', color: 'var(--dm-text)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--dm-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Create Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required disabled={loading}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', background: 'var(--dm-input)', border: '1px solid var(--dm-border)', borderRadius: '8px', padding: '14px', fontSize: '16px', color: 'var(--dm-text)', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dm-muted)' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--dm-muted)', marginTop: '6px' }}>Min 8 chars with uppercase, lowercase, number &amp; special char.</p>
            </div>

            {error && (
              <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: 500, textAlign: 'center' }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: '12px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', color: '#34d399', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                {successMsg}
              </div>
            )}

            <button type="submit" disabled={loading || code.length < 6 || password.length < 8}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 800, fontSize: '15px', border: 'none', cursor: (loading || code.length < 6 || password.length < 8) ? 'not-allowed' : 'pointer', opacity: (loading || code.length < 6 || password.length < 8) ? 0.5 : 1 }}>
              {loading ? <><Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" /> Verifying...</> : 'Complete Signup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
