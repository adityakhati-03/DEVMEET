'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { TerminalSquare, Clock, ArrowRight, PlusCircle, FolderOpen, Trash2, Loader2, Circle } from 'lucide-react';
import { toast } from 'sonner';

const card: React.CSSProperties = { background: 'var(--dm-card)', border: '1px solid var(--dm-border)', borderRadius: '12px', padding: '24px' };

type Participant = { _id: string; name: string };
type Room = { _id: string; roomId: string; createdBy: Participant; participants: Participant[]; createdAt: string };

export default function MyRoomsPage() {
  const { data: session } = useSession();
  const [rooms, setRooms]   = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setLoading(true);
      fetch('/api/room/user-rooms')
        .then(r => r.json())
        .then(d => {
          const user = session?.user as { _id?: string };
          const all: Room[] = d.rooms || [];
          setRooms(all.filter(r => r.createdBy?._id === user?._id));
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  const handleDelete = async (roomId: string) => {
    if (!confirm(`Delete room "${roomId}"? This cannot be undone.`)) return;
    setDeleting(roomId);
    try {
      const res = await fetch(`/api/room/${roomId}`, { method: 'DELETE' });
      if (res.ok) { setRooms(p => p.filter(r => r.roomId !== roomId)); toast.success('Room deleted'); }
      else { const d = await res.json(); toast.error(d.message || 'Failed'); }
    } catch { toast.error('Network error'); }
    finally { setDeleting(null); }
  };

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '1000px', margin: '0 auto', color: 'var(--dm-text)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            My <span style={{ color: '#34d399' }}>Rooms</span>
          </h1>
          <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '6px 0 0' }}>
            All rooms you have created — {loading ? '…' : rooms.length} total
          </p>
        </div>
        <Link href="/room/create-room"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
          <PlusCircle style={{ width: '16px', height: '16px' }} /> New Room
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} style={{ ...card, height: '180px', opacity: 0.4 }} className="animate-pulse" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '64px 24px' }}>
          <FolderOpen style={{ width: '40px', height: '40px', color: 'var(--dm-muted)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>No rooms yet</p>
          <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '0 0 20px' }}>Create your first room to start collaborating</p>
          <Link href="/room/create-room"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            <PlusCircle style={{ width: '16px', height: '16px' }} /> Create a Room
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
          {rooms.map(room => (
            <div key={room._id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '20px' }} className="room-card-hover">
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TerminalSquare style={{ width: '18px', height: '18px', color: '#34d399' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.roomId}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--dm-muted)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '11px', height: '11px' }} />
                      {new Date(room.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', fontSize: '10px', fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Circle style={{ width: '5px', height: '5px', fill: '#34d399', color: '#34d399' }} /> Active
                </span>
              </div>

              {/* Participants */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex' }}>
                  {room.participants.slice(0, 5).map(p => (
                    <Image key={p._id}
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=28&background=12141a&color=34d399`}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--dm-card)', marginLeft: '-6px' }}
                      alt={p.name}
                      width={28}
                      height={28}
                      unoptimized
                    />
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--dm-muted)' }}>
                  {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href={`/room/${room.roomId}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                  Enter <ArrowRight style={{ width: '14px', height: '14px' }} />
                </Link>
                <button onClick={() => handleDelete(room.roomId)} disabled={deleting === room.roomId}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 600, fontSize: '13px', cursor: 'pointer', opacity: deleting === room.roomId ? 0.5 : 1 }}>
                  {deleting === room.roomId ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : <Trash2 style={{ width: '14px', height: '14px' }} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
