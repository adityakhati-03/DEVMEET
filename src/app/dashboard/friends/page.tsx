'use client';
import { useEffect, useState } from 'react';
import { UserPlus, Users, Bell, Check, X, Trash2, Search, Loader2, UserCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

const card: React.CSSProperties = { background: 'var(--dm-card)', border: '1px solid var(--dm-border)', borderRadius: '12px', padding: '24px' };
const inputStyle: React.CSSProperties = { flex: 1, background: 'var(--dm-input)', border: '1px solid var(--dm-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: 'var(--dm-text)', outline: 'none' };

type FriendUser = { _id: string; name: string; username: string; email: string; avatar?: string };
type Friend      = { friendshipId: string; user: FriendUser; since: string };
type Request     = { _id: string; requester: FriendUser; createdAt: string };
type Outgoing    = { _id: string; recipient: FriendUser; createdAt: string };

const Avatar = ({ user, size = 40 }: { user: FriendUser; size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 800, color: '#34d399', flexShrink: 0 }}>
    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
  </div>
);

export default function FriendsPage() {
  const [friends, setFriends]   = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<Request[]>([]);
  const [outgoing, setOutgoing] = useState<Outgoing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [sending, setSending]   = useState(false);
  const [tab, setTab]           = useState<'friends' | 'requests' | 'sent'>('friends');

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/friends');
      const data = await res.json();
      if (data.success) {
        setFriends(data.friends);
        setIncoming(data.incoming);
        setOutgoing(data.outgoing);
      }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const sendRequest = async () => {
    if (!query.trim()) { toast.error('Enter an email or username'); return; }
    setSending(true);
    try {
      const res  = await fetch('/api/friends', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
      const data = await res.json();
      if (res.ok) { toast.success('Friend request sent!'); setQuery(''); load(); }
      else         toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSending(false); }
  };

  const respond = async (id: string, action: 'accept' | 'decline') => {
    const res  = await fetch(`/api/friends/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    const data = await res.json();
    if (res.ok) { toast.success(action === 'accept' ? 'Friend added!' : 'Request declined'); load(); }
    else          toast.error(data.message);
  };

  const remove = async (id: string, label: string) => {
    if (!confirm(`Remove ${label}?`)) return;
    const res = await fetch(`/api/friends/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Removed'); load(); }
  };

  const pill = (t: typeof tab, label: string, count: number) => (
    <button onClick={() => setTab(t)} style={{
      padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
      cursor: 'pointer', border: 'none', transition: 'all 150ms',
      background: tab === t ? 'rgba(52,211,153,0.1)' : 'transparent',
      color: tab === t ? '#34d399' : 'var(--dm-muted)',
      display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      {label}
      {count > 0 && <span style={{ fontSize: '11px', background: tab === t ? '#34d399' : 'var(--dm-surface)', color: tab === t ? '#080a0f' : 'var(--dm-muted)', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>{count}</span>}
    </button>
  );

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '800px', margin: '0 auto', color: 'var(--dm-text)' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
          My <span style={{ color: '#34d399' }}>Friends</span>
        </h1>
        <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '6px 0 0' }}>
          Connect with fellow developers on DevMeet
        </p>
      </div>

      {/* Add Friend */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dm-muted)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus style={{ width: '14px', height: '14px', color: '#34d399' }} /> Add Friend
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendRequest()}
            style={inputStyle}
            placeholder="Enter username or email address..."
          />
          <button onClick={sendRequest} disabled={sending}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: sending ? 0.7 : 1 }}>
            {sending ? <Loader2 style={{ width: '15px', height: '15px' }} className="animate-spin" /> : <UserPlus style={{ width: '15px', height: '15px' }} />}
            Send Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--dm-border)', paddingBottom: '1px' }}>
        {pill('friends',  'Friends',          friends.length)}
        {pill('requests', 'Requests',          incoming.length)}
        {pill('sent',     'Sent',              outgoing.length)}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1,2,3].map(i => <div key={i} style={{ ...card, height: '72px', opacity: 0.4 }} className="animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Friends list */}
          {tab === 'friends' && (
            friends.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
                <Users style={{ width: '36px', height: '36px', color: 'var(--dm-muted)', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 6px' }}>No friends yet</p>
                <p style={{ color: 'var(--dm-muted)', fontSize: '13px' }}>Add someone using their username or email above</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {friends.map(f => (
                  <div key={f.friendshipId} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Avatar user={f.user} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>{f.user.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--dm-muted)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        @{f.user.username} · <Clock style={{ width: '10px', height: '10px' }} /> Friends since {new Date(f.since).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={() => remove(f.friendshipId, f.user.name)}
                      style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Trash2 style={{ width: '12px', height: '12px' }} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Incoming requests */}
          {tab === 'requests' && (
            incoming.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
                <Bell style={{ width: '36px', height: '36px', color: 'var(--dm-muted)', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 6px' }}>No pending requests</p>
                <p style={{ color: 'var(--dm-muted)', fontSize: '13px' }}>When someone sends you a request, it'll appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {incoming.map(req => (
                  <div key={req._id} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Avatar user={req.requester} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>{req.requester.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--dm-muted)', margin: '3px 0 0' }}>
                        @{req.requester.username} · wants to be your friend
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => respond(req._id, 'accept')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                        <Check style={{ width: '13px', height: '13px' }} /> Accept
                      </button>
                      <button onClick={() => respond(req._id, 'decline')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '7px', background: 'var(--dm-surface)', color: 'var(--dm-muted)', fontWeight: 600, fontSize: '13px', border: '1px solid var(--dm-border)', cursor: 'pointer' }}>
                        <X style={{ width: '13px', height: '13px' }} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Sent requests */}
          {tab === 'sent' && (
            outgoing.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
                <UserCheck style={{ width: '36px', height: '36px', color: 'var(--dm-muted)', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 6px' }}>No sent requests</p>
                <p style={{ color: 'var(--dm-muted)', fontSize: '13px' }}>Requests you send will appear here until accepted</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {outgoing.map(req => (
                  <div key={req._id} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Avatar user={req.recipient} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>{req.recipient.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--dm-muted)', margin: '3px 0 0' }}>
                        @{req.recipient.username} · request pending
                      </p>
                    </div>
                    <button onClick={() => remove(req._id, 'request')}
                      style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--dm-surface)', border: '1px solid var(--dm-border)', color: 'var(--dm-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
