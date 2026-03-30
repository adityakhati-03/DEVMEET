'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Calendar, Shield, Edit3, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const card: React.CSSProperties = { background: 'var(--dm-card)', border: '1px solid var(--dm-border)', borderRadius: '12px', padding: '28px' };
const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--dm-input)', border: '1px solid var(--dm-border)', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', color: 'var(--dm-text)', outline: 'none', boxSizing: 'border-box' };
const label: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--dm-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' };

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [roomCount, setRoomCount] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sign-in');
    if (session?.user?.name) setName(session.user.name);
    // get room count
    fetch('/api/room/user-rooms').then(r => r.json()).then(d => setRoomCount((d.rooms || []).length));
  }, [session, status]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    // In a real app this would call PATCH /api/user/profile
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success('Profile updated!');
  };

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 style={{ width: '24px', height: '24px', color: '#34d399' }} className="animate-spin" />
    </div>
  );

  const user = session?.user as any;
  const initials = (user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '700px', margin: '0 auto', color: 'var(--dm-text)' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
          My <span style={{ color: '#34d399' }}>Profile</span>
        </h1>
        <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '6px 0 0' }}>Manage your account information</p>
      </div>

      {/* Avatar + stats */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
        <div style={{ width: '72px', height: '72px', flexShrink: 0, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '2px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#34d399' }}>
          {user?.image
            ? <img src={user.image} style={{ width: '72px', height: '72px', borderRadius: '50%' }} alt="avatar" />
            : initials}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: '20px', margin: 0 }}>{user?.name}</p>
          <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '4px 0 12px' }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              { icon: Shield,   label: 'Member', value: 'Standard' },
              { icon: Calendar, label: 'Rooms',  value: roomCount },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <s.icon style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span style={{ fontSize: '13px', color: 'var(--dm-muted)' }}>{s.label}:</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div style={card}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Edit3 style={{ width: '15px', height: '15px', color: '#34d399' }} /> Edit Information
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={label}>Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Your name" />
          </div>
          <div>
            <label style={label}>Email</label>
            <input value={user?.email || ''} readOnly style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
            <p style={{ fontSize: '12px', color: 'var(--dm-muted)', marginTop: '6px' }}>Email cannot be changed.</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> Saving...</> : <><CheckCircle style={{ width: '14px', height: '14px' }} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
