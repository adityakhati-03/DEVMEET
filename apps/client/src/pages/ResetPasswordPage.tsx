import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { authService } from '../services/authService';

export default function ResetPasswordPage() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username') ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const result = await authService.resetPassword(username, code, newPassword);
      setSuccessMsg(result.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10" style={{ background: 'var(--dm-bg)' }}>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div style={{ background: 'var(--dm-card)', border: '1px solid var(--dm-border)', borderRadius: '12px', padding: '32px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Lock style={{ width: '22px', height: '22px', color: '#34d399' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--dm-text)', margin: 0 }}>Reset Password</h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Code from email', 'New password', 'Confirm new password'].map((label, i) => (
              <div key={i}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--dm-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</label>
                <input
                  type={i === 0 ? 'text' : 'password'}
                  placeholder={i === 0 ? '123456' : i === 1 ? 'New password' : 'Confirm password'}
                  required disabled={loading}
                  value={i === 0 ? code : i === 1 ? newPassword : confirmPassword}
                  onChange={(e) => i === 0 ? setCode(e.target.value) : i === 1 ? setNewPassword(e.target.value) : setConfirmPassword(e.target.value)}
                  style={{ width: '100%', background: 'var(--dm-input)', border: '1px solid var(--dm-border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--dm-text)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>{error}</div>}
            {successMsg && <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', color: '#34d399', fontSize: '13px' }}>{successMsg}</div>}

            <button type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 800, fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px' }}>
              {loading ? <><Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" /> Resetting...</> : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
