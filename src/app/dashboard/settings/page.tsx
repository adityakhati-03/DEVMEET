'use client';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Trash2, Moon, Sun, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

const card: React.CSSProperties = { background: 'var(--dm-card)', border: '1px solid var(--dm-border)', borderRadius: '12px', padding: '28px', marginBottom: '16px' };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--dm-border)' };
const label: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: 'var(--dm-text)' };
const sub: React.CSSProperties = { fontSize: '12px', color: 'var(--dm-muted)', marginTop: '2px' };

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: checked ? '#34d399' : 'var(--dm-surface)', cursor: 'pointer', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: '3px', left: checked ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 200ms' }} />
    </button>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [notifs, setNotifs]       = useState({ roomJoin: true, messages: false, updates: true });
  const [privacy, setPrivacy]     = useState({ publicProfile: true, showActivity: true });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting]   = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    setDeleting(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.error('Account deletion is disabled in this demo.');
    setDeleting(false);
    setShowDelete(false);
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dm-muted)', margin: '0 0 4px' }}>{children}</h2>
  );

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '700px', margin: '0 auto', color: 'var(--dm-text)' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
          Account <span style={{ color: '#34d399' }}>Settings</span>
        </h1>
        <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '6px 0 0' }}>Customize your DevMeet experience</p>
      </div>

      {/* Appearance */}
      <div style={card}>
        <SectionTitle>Appearance</SectionTitle>
        <div style={{ ...row, borderBottom: 'none' }}>
          <div>
            <p style={label}>Theme</p>
            <p style={sub}>{isDark ? 'Dark mode active' : 'Light mode active'}</p>
          </div>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--dm-surface)', border: '1px solid var(--dm-border)', color: 'var(--dm-text)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
            {isDark ? <Sun style={{ width: '15px', height: '15px' }} /> : <Moon style={{ width: '15px', height: '15px' }} />}
            Switch to {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div style={card}>
        <SectionTitle>Notifications</SectionTitle>
        {[
          { key: 'roomJoin', label: 'Room join alerts', sub: 'Notify when someone joins your room' },
          { key: 'messages', label: 'Chat messages',    sub: 'Notify for new chat messages' },
          { key: 'updates',  label: 'Platform updates', sub: 'DevMeet feature announcements' },
        ].map((item, i, arr) => (
          <div key={item.key} style={{ ...row, borderBottom: i === arr.length - 1 ? 'none' : undefined }}>
            <div>
              <p style={label}>{item.label}</p>
              <p style={sub}>{item.sub}</p>
            </div>
            <Toggle checked={(notifs as Record<string, boolean>)[item.key]} onChange={v => { setNotifs(p => ({ ...p, [item.key]: v })); toast.success('Saved'); }} />
          </div>
        ))}
      </div>

      {/* Privacy */}
      <div style={card}>
        <SectionTitle>Privacy</SectionTitle>
        {[
          { key: 'publicProfile', label: 'Public profile',   sub: 'Let others find your profile' },
          { key: 'showActivity',  label: 'Show activity',    sub: 'Let others see your room activity' },
        ].map((item, i, arr) => (
          <div key={item.key} style={{ ...row, borderBottom: i === arr.length - 1 ? 'none' : undefined }}>
            <div>
              <p style={label}>{item.label}</p>
              <p style={sub}>{item.sub}</p>
            </div>
            <Toggle checked={(privacy as Record<string, boolean>)[item.key]} onChange={v => { setPrivacy(p => ({ ...p, [item.key]: v })); toast.success('Saved'); }} />
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div style={card}>
        <SectionTitle>Session</SectionTitle>
        <div style={{ ...row, borderBottom: 'none' }}>
          <div>
            <p style={label}>Sign out</p>
            <p style={sub}>You are signed in as {session?.user?.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/sign-in' })}
            style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ ...card, marginBottom: 0, border: '1px solid rgba(239,68,68,0.2)' }}>
        <SectionTitle>Danger Zone</SectionTitle>
        <div style={{ ...row, borderBottom: 'none' }}>
          <div>
            <p style={{ ...label, color: '#f87171' }}>Delete Account</p>
            <p style={sub}>Permanently remove your account and all data</p>
          </div>
          <button onClick={() => setShowDelete(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
            <Trash2 style={{ width: '13px', height: '13px' }} />
            {showDelete ? 'Cancel' : 'Delete'}
          </button>
        </div>
        {showDelete && (
          <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '12px' }}>
              Type <strong>DELETE</strong> to confirm permanent account deletion.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Type DELETE"
                style={{ flex: 1, background: 'var(--dm-input)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '14px', outline: 'none' }} />
              <button onClick={handleDeleteAccount} disabled={deleting}
                style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.8)', color: 'white', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
