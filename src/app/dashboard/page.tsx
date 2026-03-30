'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  PlusCircle, DoorOpen, Users, Activity,
  Star, Clock, TerminalSquare, MessageSquare,
  Play, SearchCode, FolderOpen, ArrowRight,
  Circle, Trash2, Loader2
} from 'lucide-react';

type Participant = { _id: string; name: string; avatar?: string; };
type Room = { _id: string; roomId: string; createdBy: Participant; participants: Participant[]; createdAt: string; };

// ── Design tokens — use CSS vars so light/dark mode both work ─────────────────
const card: React.CSSProperties = {
  background: 'var(--dm-card)',
  border: '1px solid var(--dm-border)',
  borderRadius: '12px',
  padding: '24px',
};
const sectionGap: React.CSSProperties = { marginBottom: '40px' };
const sectionHead: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: '16px',
};
const sectionTitle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontSize: '13px', fontWeight: 700, color: 'var(--dm-text)',
  textTransform: 'uppercase', letterSpacing: '0.07em',
};
const badge: React.CSSProperties = {
  padding: '2px 8px', borderRadius: '20px',
  background: 'var(--dm-surface)',
  color: 'var(--dm-muted)', fontSize: '11px', fontWeight: 700,
};
const btn = (variant: 'primary' | 'ghost' | 'danger'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '10px 18px', borderRadius: '8px',
  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
  transition: 'all 150ms', border: 'none',
  ...(variant === 'primary' && { background: '#34d399', color: '#080a0f' }),
  ...(variant === 'ghost'   && { background: 'var(--dm-surface)', color: 'var(--dm-text)', border: '1px solid var(--dm-border)' }),
  ...(variant === 'danger'  && { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }),
});

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [joinId, setJoinId]     = useState('');

  useEffect(() => {
    fetch('/api/room/user-rooms')
      .then(r => r.json())
      .then(d => setRooms(d.rooms || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const user         = (session?.user as any) || {};
  const createdRooms = rooms.filter(r => r.createdBy?._id === user._id);
  const joinedRooms  = rooms.filter(r => r.createdBy?._id !== user._id);

  const handleDelete = async (roomId: string) => {
    if (!confirm(`Delete room "${roomId}"? This cannot be undone.`)) return;
    setDeleting(roomId);
    try {
      const res  = await fetch(`/api/room/${roomId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) { setRooms(p => p.filter(r => r.roomId !== roomId)); toast.success('Room deleted'); }
      else toast.error(data.message || 'Failed to delete room');
    } catch { toast.error('Network error'); }
    finally { setDeleting(null); }
  };

  /* ── Skeleton ── */
  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '40px 40px 80px', maxWidth: '1300px', margin: '0 auto', color: 'var(--dm-text)' }}>
        <div style={{ ...card, height: '80px', marginBottom: '32px', opacity: 0.5 }} className="animate-pulse" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ ...card, height: '100px', opacity: 0.5 }} className="animate-pulse" />)}
        </div>
        <div style={{ ...card, height: '300px', opacity: 0.5 }} className="animate-pulse" />
      </div>
    );
  }

  /* ── Room Card ── */
  const RoomCard = ({ room, isOwner }: { room: Room; isOwner: boolean }) => (
    <div style={{
      ...card,
      display: 'flex', flexDirection: 'column', gap: '20px',
      transition: 'border-color 200ms, background 200ms',
    }}
      className="room-card-hover"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TerminalSquare style={{ width: '18px', height: '18px', color: '#34d399' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }} title={room.roomId}>
              {room.roomId}
            </p>
            <p style={{ fontSize: '12px', color: '#78716c', display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0 0' }}>
              <Clock style={{ width: '11px', height: '11px' }} />
              {new Date(room.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', fontSize: '11px', fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Circle style={{ width: '6px', height: '6px', fill: '#34d399', color: '#34d399' }} /> Active
        </span>
      </div>

      {/* Participants */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex' }}>
          {room.participants.slice(0, 4).map(p => (
            <img key={p._id}
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=32&background=12141a&color=34d399`}
              style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #0d0f14', marginLeft: '-6px' }}
              alt={p.name}
            />
          ))}
        </div>
        <span style={{ fontSize: '12px', color: '#78716c' }}>
          {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <Link href={`/room/${room.roomId}`} style={{ ...btn('primary'), flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
          Enter Room <ArrowRight style={{ width: '15px', height: '15px' }} />
        </Link>
        {isOwner && (
          <button
            onClick={() => handleDelete(room.roomId)}
            disabled={deleting === room.roomId}
            style={{ ...btn('danger'), opacity: deleting === room.roomId ? 0.5 : 1 }}
          >
            <Trash2 style={{ width: '15px', height: '15px' }} />
            {deleting === room.roomId ? '...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );

  /* ── Empty State ── */
  const Empty = ({ label, cta, href }: { label: string; cta: string; href: string }) => (
    <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)', gap: '12px' }}>
      <p style={{ color: '#78716c', fontSize: '14px', margin: 0 }}>{label}</p>
      <Link href={href} style={{ color: '#34d399', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
        {cta} <ArrowRight style={{ width: '14px', height: '14px' }} />
      </Link>
    </div>
  );

  /* ── Page ── */
  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>

      {/* ── Welcome ── */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
          Good evening, <span style={{ color: '#34d399' }}>{user.name}</span> 👋
        </h1>
        <p style={{ color: '#78716c', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>{user.email}</p>
      </div>

      {/* ── Stats + Create Room ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr) 220px', gap: '16px', marginBottom: '48px' }}>
        {[
          { label: 'Hosted Rooms',    value: createdRooms.length, icon: DoorOpen, accent: 'Active'  },
          { label: 'Joined Rooms',    value: joinedRooms.length,  icon: Users,      accent: 'Collaborating' },
          { label: 'Total Rooms',     value: rooms.length,        icon: TerminalSquare, accent: 'Synced' },
        ].map((s, i) => (
          <div key={i} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
              <s.icon style={{ width: '16px', height: '16px', color: '#34d399', opacity: 0.6 }} />
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'white', margin: 0 }}>
              {s.value}
              {s.accent && <span style={{ fontSize: '12px', color: '#34d399', marginLeft: '8px', fontWeight: 700 }}>{s.accent}</span>}
            </p>
          </div>
        ))}

        {/* Create Room CTA */}
        <Link href="/room/create-room" style={{
          ...btn('primary'),
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '10px',
          textDecoration: 'none', borderRadius: '12px',
          padding: '24px', fontSize: '16px',
        }}>
          <PlusCircle style={{ width: '28px', height: '28px' }} />
          Create Room
        </Link>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>

        {/* Left Column */}
        <div>

          {/* Quick Actions */}
          <div style={sectionGap}>
            <div style={sectionHead}>
              <span style={sectionTitle}>Quick Actions</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Join Room */}
              <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <SearchCode style={{ width: '18px', height: '18px', color: 'white' }} />
                  </div>
                  <h3 style={{ fontWeight: 700, color: 'white', fontSize: '15px', margin: '0 0 6px' }}>Join via Room ID</h3>
                  <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>Jump into a colleague's room instantly.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text" placeholder="Room ID..." value={joinId}
                    onChange={e => setJoinId(e.target.value)}
                    style={{ flex: 1, background: '#080a0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: 'white', outline: 'none' }}
                  />
                  <Link
                    href={joinId ? `/room/${joinId}` : '#'}
                    style={{ ...btn('ghost'), textDecoration: 'none', padding: '10px 16px' }}
                  >
                    Join
                  </Link>
                </div>
              </div>

              {/* Resume Session */}
              <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <Play style={{ width: '18px', height: '18px', color: '#34d399' }} />
                  </div>
                  <h3 style={{ fontWeight: 700, color: 'white', fontSize: '15px', margin: '0 0 6px' }}>Resume Last Session</h3>
                  <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>
                    {rooms[0] ? <>Continue in <span style={{ fontFamily: 'monospace', color: '#d4d4d8' }}>{rooms[0].roomId}</span></> : 'No recent sessions yet.'}
                  </p>
                </div>
                <Link
                  href={rooms[0] ? `/room/${rooms[0].roomId}` : '/room/create-room'}
                  style={{ ...btn('primary'), textDecoration: 'none', justifyContent: 'center' }}
                >
                  {rooms[0] ? 'Resume Coding' : 'Create First Room'}
                  <ArrowRight style={{ width: '15px', height: '15px' }} />
                </Link>
              </div>
            </div>
          </div>

          {/* Hosted Rooms */}
          <div style={sectionGap}>
            <div style={sectionHead}>
              <span style={sectionTitle}>
                <FolderOpen style={{ width: '15px', height: '15px', color: '#34d399' }} />
                Hosted Rooms
                <span style={badge}>{createdRooms.length}</span>
              </span>
              <Link href="/room/create-room" style={{ ...btn('ghost'), fontSize: '13px', padding: '8px 14px', textDecoration: 'none' }}>
                <PlusCircle style={{ width: '14px', height: '14px' }} /> New Room
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
              {createdRooms.length === 0
                ? <Empty label="You haven't hosted any rooms yet." cta="Create your first room" href="/room/create-room" />
                : createdRooms.map(r => <RoomCard key={r._id} room={r} isOwner />)
              }
            </div>
          </div>

          {/* Joined Rooms */}
          <div>
            <div style={sectionHead}>
              <span style={sectionTitle}>
                <DoorOpen style={{ width: '15px', height: '15px', color: '#34d399' }} />
                Joined Rooms
                <span style={badge}>{joinedRooms.length}</span>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
              {joinedRooms.length === 0
                ? <Empty label="You haven't joined any rooms yet." cta="Explore community rooms" href="/community" />
                : joinedRooms.map(r => <RoomCard key={r._id} room={r} isOwner={false} />)
              }
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Online Now */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ ...sectionTitle, fontSize: '11px' }}>Online Now</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#78716c', fontWeight: 700 }}>
                <Circle style={{ width: '7px', height: '7px', fill: '#78716c', color: '#78716c' }} /> Feature Coming Soon
              </span>
            </div>
            <div style={{ padding: '8px' }}>
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>Presence tracking will be available in the next update.</p>
            </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ ...sectionTitle, fontSize: '11px' }}>Recent Activity</span>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>No recent activity to show.</p>
              </div>
            </div>
          </div>

          {/* Pinned Rooms */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star style={{ width: '13px', height: '13px', color: '#34d399' }} />
              <span style={{ ...sectionTitle, fontSize: '11px' }}>Pinned Rooms</span>
            </div>
            {rooms.slice(0, 3).length > 0 ? (
              <div style={{ padding: '8px' }}>
                {rooms.slice(0, 3).map(r => (
                  <Link key={r._id} href={`/room/${r.roomId}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none' }}
                    className="nsoc-nav-link"
                  >
                    <div style={{ width: '30px', height: '30px', flexShrink: 0, borderRadius: '8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TerminalSquare style={{ width: '13px', height: '13px', color: '#34d399' }} />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#78716c', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.roomId}</span>
                    <ArrowRight style={{ width: '13px', height: '13px', color: '#78716c', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#78716c', fontSize: '13px' }}>
                Star a room to pin it here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
