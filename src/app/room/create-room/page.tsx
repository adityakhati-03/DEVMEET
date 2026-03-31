'use client';

import { useState, useEffect, Suspense } from 'react';
import { nanoid } from 'nanoid';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  CopyIcon, Lock, Globe, Loader2, ArrowRight,
  Settings, Video, MessageSquare, UserPlus,
  PlusCircle, DoorOpen
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

type RoomType = 'public' | 'private';
type RoomSettings = { isPrivate: boolean; maxParticipants: number; allowChat: boolean; allowVideo: boolean; };

// ── Shared design tokens — CSS vars for light/dark switching ──────────────────
const card: React.CSSProperties = {
  background: 'var(--dm-card)',
  border: '1px solid var(--dm-border)',
  borderRadius: '12px',
  padding: '28px',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--dm-input)',
  border: '1px solid var(--dm-border)',
  borderRadius: '8px',
  padding: '11px 14px',
  fontSize: '14px',
  color: 'var(--dm-text)',
  outline: 'none',
  boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--dm-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '8px',
};
const primaryBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  width: '100%',
  padding: '13px 20px',
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: 700,
  background: '#34d399',
  color: '#080a0f',
  border: 'none',
  cursor: 'pointer',
  transition: 'filter 150ms',
};

function CreateRoomContent() {
  const { data: session, status } = useSession();
  const [username, setUsername]       = useState('');
  const [roomId, setRoomId]           = useState('');
  const [joinRoomId, setJoinRoomId]   = useState('');
  const [tab, setTab]                 = useState<'create' | 'join'>('create');
  const [roomType, setRoomType]       = useState<RoomType>('public');
  const [settings, setSettings]       = useState<RoomSettings>({ isPrivate: false, maxParticipants: 4, allowChat: true, allowVideo: true });
  const [isLoading, setIsLoading]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-switch to join tab if ?tab=join is in the URL
  useEffect(() => {
    if (searchParams?.get('tab') === 'join') setTab('join');
  }, [searchParams]);

  useEffect(() => { setRoomId(nanoid(10)); }, []);
  useEffect(() => {
    if (session?.user && 'username' in session.user) setUsername((session.user as { username: string }).username);
    else if (session?.user?.name) setUsername(session.user.name!);
  }, [session]);

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 style={{ width: '24px', height: '24px', color: '#34d399' }} className="animate-spin" />
    </div>
  );
  if (status === 'unauthenticated') { router.push('/sign-in'); return null; }

  const handleCreateRoom = async () => {
    if (!username.trim()) { toast.error('Please enter your name'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/room/create', {
        method: 'POST',
        body: JSON.stringify({ roomId, settings, type: roomType }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Room creation failed');
      setCreatedRoomId(roomId);
      toast.success('Room created!');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to create room');
    } finally { setIsLoading(false); }
  };

  const handleJoinRoom = async () => {
    if (!username.trim() || !joinRoomId.trim()) { toast.error('Fill in all fields'); return; }
    setIsLoading(true);
    try {
      const res  = await fetch('/api/room/join', {
        method: 'POST',
        body: JSON.stringify({ roomId: joinRoomId }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Room not found');
      toast.success('Joining...');
      router.push(`/room/${joinRoomId}?username=${encodeURIComponent(username)}`);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to join');
    } finally { setIsLoading(false); }
  };

  const tabPill = (active: boolean): React.CSSProperties => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', padding: '10px 20px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer', border: 'none',
    transition: 'all 150ms',
    background: active ? '#34d399' : 'transparent',
    color: active ? '#080a0f' : '#78716c',
  });

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '680px', margin: '0 auto', width: '100%', color: 'var(--dm-text)' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#34d399' }}>Start</span> Coding Together
        </h1>
        <p style={{ color: '#78716c', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
          Create a shared room or join an existing one to collaborate in real-time
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: 'var(--dm-surface)', border: '1px solid var(--dm-border)', borderRadius: '10px', padding: '4px', marginBottom: '24px', gap: '4px' }}>
        <button onClick={() => setTab('create')} style={tabPill(tab === 'create')}>
          <PlusCircle style={{ width: '16px', height: '16px' }} /> Create Room
        </button>
        <button onClick={() => setTab('join')} style={tabPill(tab === 'join')}>
          <DoorOpen style={{ width: '16px', height: '16px' }} /> Join Room
        </button>
      </div>

      {/* Main Card */}
      <div style={card}>

        {/* Your Name */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Your Display Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={inputStyle}
          />
        </div>

        {tab === 'create' ? (
          <>
            {/* Room ID (auto-generated, read-only) */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Room ID (auto-generated)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  readOnly
                  value={roomId}
                  style={{ ...inputStyle, fontFamily: 'monospace', color: '#34d399', flex: 1 }}
                />
                <button
                  onClick={() => { setRoomId(nanoid(10)); setCreatedRoomId(null); }}
                  title="Regenerate"
                  style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#78716c', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  className="nsoc-icon-btn"
                >
                  ↻ New
                </button>
              </div>
            </div>

            {/* Room Type */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Room Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setRoomType('public')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', borderRadius: '10px', border: 'none',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
                    background: roomType === 'public' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
                    color: roomType === 'public' ? '#34d399' : '#78716c',
                    outline: roomType === 'public' ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Globe style={{ width: '18px', height: '18px' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div>Public</div>
                    <div style={{ fontSize: '11px', fontWeight: 400, color: '#78716c', marginTop: '2px' }}>Anyone with ID</div>
                  </div>
                </button>
                <button
                  onClick={() => setRoomType('private')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', borderRadius: '10px', border: 'none',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
                    background: roomType === 'private' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
                    color: roomType === 'private' ? '#34d399' : '#78716c',
                    outline: roomType === 'private' ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Lock style={{ width: '18px', height: '18px' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div>Private</div>
                    <div style={{ fontSize: '11px', fontWeight: 400, color: '#78716c', marginTop: '2px' }}>Invite only</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Advanced Settings */}
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setShowSettings(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#78716c', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                className="nsoc-icon-btn"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings style={{ width: '16px', height: '16px' }} /> Advanced Settings
                </span>
                <span style={{ fontSize: '12px' }}>{showSettings ? '▲ Hide' : '▼ Show'}</span>
              </button>

              {showSettings && (
                <div style={{ marginTop: '12px', padding: '20px', background: '#080a0f', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'white' }}>
                      <UserPlus style={{ width: '16px', height: '16px', color: '#34d399' }} /> Max Participants
                    </div>
                    <input
                      type="number" min="2" max="10" value={settings.maxParticipants}
                      onChange={e => setSettings({ ...settings, maxParticipants: parseInt(e.target.value) })}
                      style={{ width: '64px', background: '#0d0f14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', color: 'white', fontSize: '14px', padding: '6px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'white' }}>
                      <MessageSquare style={{ width: '16px', height: '16px', color: '#34d399' }} /> Enable Chat
                      <span style={{ fontSize: '10px', background: 'rgba(234,179,8,0.15)', color: '#facc15', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Soon</span>
                    </div>
                    <Switch checked={settings.allowChat} onCheckedChange={v => setSettings({ ...settings, allowChat: v })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'white' }}>
                      <Video style={{ width: '16px', height: '16px', color: '#34d399' }} /> Enable Video
                      <span style={{ fontSize: '10px', background: 'rgba(234,179,8,0.15)', color: '#facc15', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Soon</span>
                    </div>
                    <Switch checked={settings.allowVideo} onCheckedChange={v => setSettings({ ...settings, allowVideo: v })} />
                  </div>
                </div>
              )}
            </div>

            {/* Success or CTA */}
            {createdRoomId ? (
              <div style={{ padding: '20px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#34d399', textAlign: 'center' }}>
                  🎉 Room created successfully!
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    readOnly value={createdRoomId}
                    style={{ ...inputStyle, fontFamily: 'monospace', flex: 1, color: '#34d399' }}
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(createdRoomId); toast.success('Copied!'); }}
                    style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#34d399', cursor: 'pointer' }}
                    className="nsoc-icon-btn"
                  >
                    <CopyIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
                <button
                  onClick={() => router.push(`/room/${createdRoomId}?username=${encodeURIComponent(username)}`)}
                  style={primaryBtn}
                  className="nsoc-cta-link"
                >
                  Enter Room <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                style={{ ...primaryBtn, opacity: isLoading ? 0.6 : 1 }}
                className="nsoc-cta-link"
              >
                {isLoading
                  ? <><Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" /> Creating...</>
                  : <><PlusCircle style={{ width: '16px', height: '16px' }} /> Create Room</>
                }
              </button>
            )}
          </>
        ) : (
          /* Join Tab */
          <>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Room ID</label>
              <input
                type="text"
                placeholder="e.g. xk-2938-bc"
                value={joinRoomId}
                onChange={e => setJoinRoomId(e.target.value)}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
                onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
              />
              <p style={{ fontSize: '12px', color: '#78716c', margin: '8px 0 0' }}>
                Ask the room owner to share their Room ID with you.
              </p>
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={isLoading}
              style={{ ...primaryBtn, opacity: isLoading ? 0.6 : 1 }}
              className="nsoc-cta-link"
            >
              {isLoading
                ? <><Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" /> Joining...</>
                : <><DoorOpen style={{ width: '16px', height: '16px' }} /> Join Room</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 style={{ width: '24px', height: '24px', color: '#34d399' }} className="animate-spin" />
      </div>
    }>
      <CreateRoomContent />
    </Suspense>
  );
}
