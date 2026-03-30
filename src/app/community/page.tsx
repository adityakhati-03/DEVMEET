"use client";
import { useState, useEffect } from "react";
import {
  Users, Calendar, MessageSquare, TrendingUp,
  MapPin, Clock, Search, Loader2, Trophy, ArrowRight
} from "lucide-react";

interface CommunityEvent {
  _id: string; title: string; description: string;
  date: string; time: string; location: string;
  attendees: { _id: string; name: string }[];
  maxAttendees: number; category: string; tags: string[];
}
interface CommunityMember {
  _id: string; name: string; username: string; bio?: string;
}
interface CommunityStats { members: number; events: number; discussions: number; projects: number; }

const TABS = ['Overview', 'Events', 'Members'] as const;

// ── Shared token ──────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--dm-card)',
  border: '1px solid var(--dm-border)',
  borderRadius: '10px',
  padding: '20px',
};
const label: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, color: 'var(--dm-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
};
const pill = (active: boolean): React.CSSProperties => ({
  padding: '8px 20px', borderRadius: '8px', fontSize: '14px',
  fontWeight: 600, cursor: 'pointer', border: 'none',
  background: active ? 'rgba(52,211,153,0.1)' : 'transparent',
  color: active ? '#34d399' : '#78716c',
  transition: 'all 150ms',
});

export default function CommunityPage() {
  const [search, setSearch]     = useState('');
  const [tab, setTab]           = useState<typeof TABS[number]>('Overview');
  const [events, setEvents]     = useState<CommunityEvent[]>([]);
  const [members, setMembers]   = useState<CommunityMember[]>([]);
  const [stats, setStats]       = useState<CommunityStats>({ members: 0, events: 0, discussions: 0, projects: 0 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const go = async () => {
      try {
        const [eRes, mRes] = await Promise.all([
          fetch('/api/community/events?limit=6'),
          fetch('/api/community/members?limit=6'),
        ]);
        const [eData, mData] = await Promise.all([eRes.json(), mRes.json()]);
        if (eData.success) setEvents(eData.data);
        if (mData.success) setMembers(mData.data);
        setStats({
          members:     mData.success ? mData.total : 0,
          events:      eData.success ? eData.total : 0,
          discussions: 0, 
          projects:    0,
        });
      } catch {/* silently fail */} finally { setLoading(false); }
    };
    go();
  }, []);

  const statCards = [
    { icon: Users,        label: 'Members',     value: stats.members },
    { icon: Calendar,     label: 'Events',      value: stats.events },
    { icon: MessageSquare,label: 'Discussions', value: stats.discussions },
    { icon: TrendingUp,   label: 'Projects',    value: stats.projects },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: 'var(--dm-text)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '6px' }}>
            DevMeet <span style={{ color: '#34d399' }}>Community</span>
          </h1>
          <p style={{ color: 'var(--dm-muted)', fontSize: '14px', fontWeight: 500 }}>
            Connect with developers, share knowledge, and build together
          </p>
        </div>

        {/* Search + Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '24px', alignItems: 'start' }}>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#78716c' }} />
            <input
              type="text"
              placeholder="Search community..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: '36px', paddingRight: '16px',
                paddingTop: '9px', paddingBottom: '9px',
                background: 'var(--dm-input)', border: '1px solid var(--dm-border)',
                borderRadius: '8px', color: 'var(--dm-text)', fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '32px' }}>
          {statCards.map((s, i) => (
            <div key={i} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={label}>{s.label}</span>
                <s.icon style={{ width: '14px', height: '14px', color: '#34d399', opacity: 0.6 }} />
              </div>
              {loading
                ? <Loader2 style={{ width: '18px', height: '18px', color: '#34d399' }} className="animate-spin" />
                : <p style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: 0 }}>{s.value.toLocaleString()}</p>
              }
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1px' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={pill(tab === t)}>{t}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
            {/* Upcoming Events */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Calendar style={{ width: '16px', height: '16px', color: '#34d399' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Upcoming Events</span>
              </div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><Loader2 style={{ width: '20px', height: '20px', color: '#34d399' }} className="animate-spin" /></div>
              ) : events.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#78716c', padding: '32px 0', fontSize: '14px' }}>
                  No upcoming events yet.
                </div>
              ) : events.slice(0, 3).map(event => (
                <div key={event._id} style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{event.title}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600 }}>{event.category}</span>
                  </div>
                  <p style={{ color: '#78716c', fontSize: '13px', marginBottom: '10px' }}>{event.description}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#78716c' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock style={{ width: '12px', height: '12px' }} />{event.date}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin style={{ width: '12px', height: '12px' }} />{event.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users style={{ width: '12px', height: '12px' }} />{event.attendees.length}/{event.maxAttendees}</span>
                  </div>
                  {event.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {event.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#78716c', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', color: '#34d399', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}
                onClick={() => setTab('Events')}
              >
                View all events <ArrowRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            {/* Top Contributors */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Trophy style={{ width: '16px', height: '16px', color: '#34d399' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Top Contributors</span>
              </div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><Loader2 style={{ width: '20px', height: '20px', color: '#34d399' }} className="animate-spin" /></div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#78716c', padding: '24px 0', fontSize: '14px' }}>No members yet.</div>
              ) : members.slice(0, 5).map((m, i) => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#34d399', flexShrink: 0 }}>
                    {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: 'white', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                    <p style={{ color: '#78716c', fontSize: '12px', margin: 0 }}>@{m.username}</p>
                  </div>
                </div>
              ))}
              <button
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#78716c', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
                onClick={() => setTab('Members')}
              >
                View all members <ArrowRight style={{ width: '13px', height: '13px' }} />
              </button>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {tab === 'Events' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', gridColumn: '1/-1' }}>
                <Loader2 style={{ width: '24px', height: '24px', color: '#34d399' }} className="animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#78716c', padding: '64px 0', gridColumn: '1/-1', fontSize: '14px' }}>No events yet.</div>
            ) : events.map(event => (
              <div key={event._id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{event.title}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{event.category}</span>
                </div>
                <p style={{ color: '#78716c', fontSize: '13px', margin: 0 }}>{event.description}</p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#78716c', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock style={{ width: '12px', height: '12px' }} />{event.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin style={{ width: '12px', height: '12px' }} />{event.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users style={{ width: '12px', height: '12px' }} />{event.attendees.length}/{event.maxAttendees}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Members Tab */}
        {tab === 'Members' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', gridColumn: '1/-1' }}>
                <Loader2 style={{ width: '24px', height: '24px', color: '#34d399' }} className="animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#78716c', padding: '64px 0', gridColumn: '1/-1', fontSize: '14px' }}>No members yet.</div>
            ) : members.map(m => (
              <div key={m._id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#34d399', flexShrink: 0 }}>
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: 'white', fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                  <p style={{ color: '#78716c', fontSize: '12px', margin: 0 }}>@{m.username}</p>
                  {m.bio && <p style={{ color: '#78716c', fontSize: '12px', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}