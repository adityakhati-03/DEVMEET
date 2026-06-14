import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PlusCircle, DoorOpen, Users,
  Star, Clock, TerminalSquare,
  Play, SearchCode, FolderOpen, ArrowRight,
  Circle, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roomService } from '../services/roomService';
import api from '../services/api';
import type { IRoom, IUser, RoomMode, InterviewType } from '@devmeet/shared';
import RoomModeBadge from '../components/rooms/RoomModeBadge';

// ── Brutalist Design tokens ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--dm-card)',
  border: '4px solid var(--dm-border)',
  borderRadius: '0px',
  padding: '24px',
  boxShadow: '8px 8px 0px rgba(255,255,255,0.05)',
  transition: 'all 0.15s ease-out',
};
const sectionGap: React.CSSProperties = { marginBottom: '40px' };
const sectionHead: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: '16px',
};
const sectionTitle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontFamily: '"Space Grotesk", system-ui, sans-serif',
  fontSize: '18px', fontWeight: 800, color: 'var(--dm-text)',
  textTransform: 'uppercase', letterSpacing: '-0.02em',
};
const badge: React.CSSProperties = {
  padding: '4px 12px', borderRadius: '0px',
  border: '2px solid var(--dm-muted)',
  background: 'var(--dm-bg)',
  fontFamily: '"JetBrains Mono", monospace',
  color: 'var(--dm-muted)', fontSize: '12px', fontWeight: 700,
};
const btn = (variant: 'primary' | 'ghost' | 'danger'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '12px 20px', borderRadius: '0px',
  fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase',
  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
  transition: 'all 0.15s', border: '2px solid transparent',
  boxShadow: '4px 4px 0px rgba(255,255,255,0.1)',
  ...(variant === 'primary' && { background: 'var(--dm-accent)', color: '#000', borderColor: 'var(--dm-accent)' }),
  ...(variant === 'ghost'   && { background: 'transparent', color: 'var(--dm-text)', borderColor: 'var(--dm-border)', boxShadow: 'none' }),
  ...(variant === 'danger'  && { background: '#ef4444', color: '#000', borderColor: '#ef4444' }),
});

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms]       = useState<IRoom[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    roomService.getRooms()
      .then(setRooms)
      .catch((err: any) => {
        toast.error('Failed to load rooms: ' + (err.response?.data?.error?.message || err.message));
      })
      .finally(() => setLoading(false));

    api.get('/api/users/active')
      .then(res => setActiveUsers(res.data.data.users))
      .catch(() => {});
  }, []);

  const userId = user?.id;
  const createdRooms = rooms.filter(r => {
    const creator = r.createdBy as IUser;
    return creator?._id === userId || r.createdBy === userId;
  });
  const joinedRooms = rooms.filter(r => {
    const creator = r.createdBy as IUser;
    return creator?._id !== userId && r.createdBy !== userId;
  });

  const { setUser } = useAuth();
  const pinnedRoomIds = new Set(user?.pinnedRooms || []);
  const pinnedRoomsList = rooms.filter(r => pinnedRoomIds.has(r.roomId));
  const recentActivity = [...rooms].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  const togglePin = async (roomId: string) => {
    try {
      const res = await api.post<{ data: { pinnedRooms: string[] } }>(`/api/users/pinned-rooms/${roomId}`);
      setUser(prev => prev ? { ...prev, pinnedRooms: res.data.data.pinnedRooms } : null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to pin room');
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm(`Delete room "${roomId}"? This cannot be undone.`)) return;
    setDeleting(roomId);
    try {
      await roomService.deleteRoom(roomId);
      setRooms(p => p.filter(r => r.roomId !== roomId));
      toast.success('Room deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete room');
    } finally {
      setDeleting(null);
    }
  };

  /* ── Skeleton ── */
  if (isLoading || loading) {
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
  const RoomCard = ({ room, isOwner }: { room: IRoom; isOwner: boolean }) => {
    const participants = room.participants as (IUser | string)[];
    return (
      <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '20px', transition: 'border-color 200ms' }}
        className="room-card-hover"
      >
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
          <div style={{ display: 'flex', gap: '8px' }}>
            {room.mode && <RoomModeBadge mode={room.mode} interviewType={room.interviewType} />}
            <button onClick={() => togglePin(room.roomId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <Star style={{ width: '14px', height: '14px', color: pinnedRoomIds.has(room.roomId) ? '#fbbf24' : '#78716c', fill: pinnedRoomIds.has(room.roomId) ? '#fbbf24' : 'none', transition: 'all 200ms' }} />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', fontSize: '11px', fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Circle style={{ width: '6px', height: '6px', fill: '#34d399', color: '#34d399' }} /> Active
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex' }}>
            {participants.slice(0, 4).map((p, i) => {
              const name = typeof p === 'string' ? p : p.name;
              return (
                <img key={i}
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=32&background=12141a&color=34d399`}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #0d0f14', marginLeft: i === 0 ? 0 : '-6px' }}
                  alt={name}
                />
              );
            })}
          </div>
          <span style={{ fontSize: '12px', color: '#78716c' }}>
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to={`/rooms/${room.roomId}`} style={{ ...btn('primary'), flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
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
  };

  /* ── Empty State ── */
  const Empty = ({ label, cta, href, action }: { label: string; cta: string; href?: string; action?: () => void }) => (
    <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)', gap: '12px' }}>
      <p style={{ color: '#78716c', fontSize: '14px', margin: 0 }}>{label}</p>
      {href ? (
        <Link to={href} style={{ color: '#34d399', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {cta} <ArrowRight style={{ width: '14px', height: '14px' }} />
        </Link>
      ) : (
        <button onClick={action} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#34d399', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
          {cta} <ArrowRight style={{ width: '14px', height: '14px' }} />
        </button>
      )}
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>

      {/* Welcome */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
          {greeting}, <span style={{ color: '#34d399' }}>{user?.name}</span> 👋
        </h1>
        <p style={{ color: '#78716c', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>{user?.email}</p>
      </div>

      {/* Stats + Create Room */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr) 220px', gap: '16px', marginBottom: '48px' }}>
        {[
          { label: 'Hosted Rooms',  value: createdRooms.length, icon: DoorOpen,      accent: 'Active' },
          { label: 'Joined Rooms',  value: joinedRooms.length,  icon: Users,         accent: 'Collaborating' },
          { label: 'Total Rooms',   value: rooms.length,        icon: TerminalSquare, accent: 'Synced' },
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

        <Link to="/create-room" style={{ ...btn('primary'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', textDecoration: 'none', borderRadius: '0px', padding: '24px', fontSize: '16px' }}>
          <PlusCircle style={{ width: '28px', height: '28px' }} />
          Create Room
        </Link>
      </div>

      {/* Main Grid */}
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
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <SearchCode style={{ width: '18px', height: '18px', color: '#34d399' }} />
                  </div>
                  <h3 style={{ fontWeight: 700, color: 'white', fontSize: '15px', margin: '0 0 6px' }}>Join via Room ID</h3>
                  <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>Jump into a colleague&apos;s room instantly.</p>
                </div>
                <Link to="/join-room" style={{ ...btn('ghost'), justifyContent: 'center', textDecoration: 'none' }}>
                  Go to Join Page <ArrowRight style={{ width: '15px', height: '15px' }} />
                </Link>
              </div>

              {/* Resume Session */}
              <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <Play style={{ width: '18px', height: '18px', color: '#34d399' }} />
                  </div>
                  <h3 style={{ fontWeight: 700, color: 'white', fontSize: '15px', margin: '0 0 6px' }}>Resume Last Session</h3>
                  <p style={{ fontSize: '13px', color: '#78716c', margin: 0 }}>
                    {recentActivity[0] ? <><>Continue in </><span style={{ fontFamily: 'monospace', color: '#d4d4d8' }}>{recentActivity[0].roomId}</span></> : 'No recent sessions yet.'}
                  </p>
                </div>
                {recentActivity[0] ? (
                  <Link
                    to={`/rooms/${recentActivity[0].roomId}`}
                    style={{ ...btn('primary'), textDecoration: 'none', justifyContent: 'center' }}
                  >
                    Resume Coding
                    <ArrowRight style={{ width: '15px', height: '15px' }} />
                  </Link>
                ) : (
                  <Link
                    to="/create-room"
                    style={{ ...btn('primary'), justifyContent: 'center', textDecoration: 'none' }}
                  >
                    Create First Room
                    <ArrowRight style={{ width: '15px', height: '15px' }} />
                  </Link>
                )}
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
              <Link to="/create-room" style={{ ...btn('ghost'), fontSize: '13px', padding: '8px 14px', textDecoration: 'none' }}>
                <PlusCircle style={{ width: '14px', height: '14px' }} /> New Room
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
              {createdRooms.length === 0
                ? <Empty label="You haven't hosted any rooms yet." cta="Create your first room" href="/create-room" />
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
                ? <Empty label="You haven't joined any rooms yet." cta="Explore community" href="/community" />
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#34d399', fontWeight: 700 }}>
                <Circle style={{ width: '7px', height: '7px', fill: '#34d399', color: '#34d399' }} /> {activeUsers.length} Active
              </span>
            </div>
            <div style={{ padding: '8px' }}>
              {activeUsers.length > 0 ? activeUsers.map(u => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px' }}>
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=12141a&color=34d399`} style={{ width: '28px', height: '28px', borderRadius: '50%' }} alt={u.name} />
                  <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{u.name}</span>
                </div>
              )) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#78716c', fontSize: '13px' }}>No users online right now.</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ ...sectionTitle, fontSize: '11px' }}>Recent Activity</span>
            </div>
            <div style={{ padding: '8px' }}>
              {recentActivity.length > 0 ? recentActivity.map(r => (
                <div key={r._id} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: '13px', color: '#e2e8f0' }}>Activity in <span style={{ fontFamily: 'monospace', color: '#34d399' }}>{r.roomId}</span></span>
                  <span style={{ fontSize: '11px', color: '#78716c' }}>{new Date(r.updatedAt).toLocaleString()}</span>
                </div>
              )) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#78716c', fontSize: '13px' }}>No recent activity to show.</div>
              )}
            </div>
          </div>

          {/* Pinned Rooms */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star style={{ width: '13px', height: '13px', color: '#fbbf24', fill: '#fbbf24' }} />
              <span style={{ ...sectionTitle, fontSize: '11px' }}>Pinned Rooms</span>
            </div>
            {pinnedRoomsList.length > 0 ? (
              <div style={{ padding: '8px' }}>
                {pinnedRoomsList.map(r => (
                  <Link key={r._id} to={`/rooms/${r.roomId}`}
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
