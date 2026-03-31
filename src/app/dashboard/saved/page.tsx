'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TerminalSquare, Clock, ArrowRight, Bookmark, Trash2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

type Participant = { _id: string; name: string };
type Room = { _id: string; roomId: string; createdBy: Participant; participants: Participant[]; createdAt: string; };

const card: React.CSSProperties = { background: 'var(--dm-card)', border: '1px solid var(--dm-border)', borderRadius: '12px', padding: '24px' };

export default function SavedPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [saved, setSaved]   = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Persist saved room IDs in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('devmeet_saved');
    if (stored) setSaved(JSON.parse(stored));
  }, []);

  useEffect(() => {
    fetch('/api/room/user-rooms')
      .then(r => r.json())
      .then(d => setRooms(d.rooms || []))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (roomId: string) => {
    const next = saved.includes(roomId) ? saved.filter(id => id !== roomId) : [...saved, roomId];
    setSaved(next);
    localStorage.setItem('devmeet_saved', JSON.stringify(next));
    toast.success(saved.includes(roomId) ? 'Removed from saved' : 'Room saved!');
  };

  const savedRooms = rooms.filter(r => saved.includes(r.roomId));

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '1000px', margin: '0 auto', color: 'var(--dm-text)' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#34d399' }}>Saved</span> Rooms
        </h1>
        <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '6px 0 0' }}>
          Bookmark rooms to access them quickly from anywhere.
        </p>
      </div>

      {/* All rooms — pin/unpin */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dm-muted)', marginBottom: '16px' }}>
          Your Rooms — click ✦ to save
        </h2>
        {loading ? (
          <div style={{ ...card, opacity: 0.5, height: '120px' }} className="animate-pulse" />
        ) : rooms.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
            <p style={{ color: 'var(--dm-muted)', fontSize: '14px', marginBottom: '16px' }}>No rooms yet.</p>
            <Link href="/room/create-room" style={{ color: '#34d399', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PlusCircle style={{ width: '14px', height: '14px' }} /> Create a room
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
            {rooms.map(r => {
              const isSaved = saved.includes(r.roomId);
              return (
                <div key={r._id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TerminalSquare style={{ width: '16px', height: '16px', color: '#34d399' }} />
                      </div>
                      <div>
                        <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', margin: 0 }}>{r.roomId}</p>
                        <p style={{ fontSize: '11px', color: 'var(--dm-muted)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock style={{ width: '10px', height: '10px' }} />{new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => toggle(r.roomId)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: isSaved ? '#34d399' : 'var(--dm-muted)', transition: 'color 150ms' }}
                      title={isSaved ? 'Remove' : 'Save'}>
                      {isSaved ? '✦' : '✧'}
                    </button>
                  </div>
                  <Link href={`/room/${r.roomId}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                    Enter Room <ArrowRight style={{ width: '14px', height: '14px' }} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved rooms quick access */}
      {savedRooms.length > 0 && (
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dm-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark style={{ width: '13px', height: '13px', color: '#34d399' }} /> Bookmarked ({savedRooms.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedRooms.map(r => (
              <div key={r._id} style={{ ...card, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, margin: 0 }}>{r.roomId}</p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Link href={`/room/${r.roomId}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
                    Enter <ArrowRight style={{ width: '13px', height: '13px' }} />
                  </Link>
                  <button onClick={() => toggle(r.roomId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dm-muted)' }} title="Remove">
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
