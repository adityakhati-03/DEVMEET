'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DoorOpen, TerminalSquare, MessageSquare, PlusCircle, ArrowRight, Clock } from 'lucide-react';

const card: React.CSSProperties = { background: 'var(--dm-card)', border: '1px solid var(--dm-border)', borderRadius: '12px', padding: '24px' };

type Room = { _id: string; roomId: string; createdBy: { _id: string; name: string }; createdAt: string; participants: { _id: string; name: string }[] };

export default function ActivityPage() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/room/user-rooms').then(r => r.json()).then(d => setRooms(d.rooms || [])).finally(() => setLoading(false));
  }, []);

  const user = session?.user as any;
  const createdRooms = rooms.filter(r => r.createdBy?._id === user?._id);
  const joinedRooms  = rooms.filter(r => r.createdBy?._id !== user?._id);

  // Build an activity feed from real room data
  const feed = [
    ...createdRooms.map(r => ({ type: 'created', room: r, time: r.createdAt, icon: PlusCircle,   color: '#34d399', text: `You created room` })),
    ...joinedRooms.map(r  => ({ type: 'joined',  room: r, time: r.createdAt, icon: DoorOpen,    color: '#60a5fa', text: `You joined room` })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '800px', margin: '0 auto', color: 'var(--dm-text)' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
          My <span style={{ color: '#34d399' }}>Activity</span>
        </h1>
        <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '6px 0 0' }}>
          A timeline of your recent actions on DevMeet
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'Total Rooms',   value: rooms.length,        icon: TerminalSquare },
          { label: 'Rooms Created', value: createdRooms.length, icon: PlusCircle },
          { label: 'Rooms Joined',  value: joinedRooms.length,  icon: DoorOpen },
        ].map((s, i) => (
          <div key={i} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dm-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
              <s.icon style={{ width: '14px', height: '14px', color: '#34d399', opacity: 0.6 }} />
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={card}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dm-muted)', margin: '0 0 20px' }}>Timeline</h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '56px', background: 'var(--dm-surface)', borderRadius: '8px', opacity: 0.5 }} className="animate-pulse" />)}
          </div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--dm-muted)', fontSize: '14px' }}>
            No activity yet. <Link href="/room/create-room" style={{ color: '#34d399', fontWeight: 700 }}>Create your first room</Link>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* vertical line */}
            <div style={{ position: 'absolute', left: '19px', top: 0, bottom: 0, width: '1px', background: 'var(--dm-border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {feed.map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingBottom: '20px', position: 'relative' }}>
                  <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '50%', background: 'var(--dm-surface)', border: '1px solid var(--dm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <ev.icon style={{ width: '16px', height: '16px', color: ev.color }} />
                  </div>
                  <div style={{ flex: 1, paddingTop: '8px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                      {ev.text} <span style={{ fontFamily: 'monospace', color: '#34d399' }}>{ev.room.roomId}</span>
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--dm-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '11px', height: '11px' }} />
                      {new Date(ev.time).toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/room/${ev.room.roomId}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', color: '#34d399', fontSize: '12px', fontWeight: 700, textDecoration: 'none', flexShrink: 0, marginTop: '6px' }}>
                    Enter <ArrowRight style={{ width: '12px', height: '12px' }} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
