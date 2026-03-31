'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Zap, Book } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    icon: Zap,
    items: [
      {
        q: 'What is DevMeet?',
        a: 'DevMeet is a real-time collaborative coding platform that lets developers create shared rooms, write and execute code together, and communicate through integrated tools — all in the browser, with zero setup.'
      },
      {
        q: 'How do I create a room?',
        a: 'Click "Create" in the navigation bar or "Create Room" on the dashboard. A unique Room ID is auto-generated. You can choose between Public (anyone with the ID can join) or Private (invite-only, coming soon). Share the Room ID with your team.'
      },
      {
        q: 'How do I join someone\'s room?',
        a: 'Use the "Join via Room ID" card on the dashboard, or go to Create Room → Join tab and enter the Room ID shared by the room owner.'
      },
      {
        q: 'Do I need to install anything?',
        a: 'No. DevMeet runs entirely in the browser. The code editor, collaboration, and execution features all work without any local setup or IDE installation.'
      },
    ]
  },
  {
    category: 'Rooms & Collaboration',
    icon: MessageSquare,
    items: [
      {
        q: 'How many people can join a room?',
        a: 'By default, rooms support up to 4 participants. Room creators can increase this to up to 10 in Advanced Settings during room creation.'
      },
      {
        q: 'What programming languages are supported?',
        a: 'DevMeet supports JavaScript, TypeScript, Python, Java, C++, HTML/CSS, SQL, and Markdown in the editor. Code execution (run button) supports JS, TS, and Python via our backend runner.'
      },
      {
        q: 'Is the collaboration real-time?',
        a: 'Yes. DevMeet uses Liveblocks for real-time cursor presence and collaborative editing — changes you make appear instantly for all participants in the room.'
      },
      {
        q: 'What happens to my rooms when I log out?',
        a: 'Your rooms are saved to the database. You can access all of them from the Dashboard under "My Rooms" or "Joined Rooms" after signing back in.'
      },
      {
        q: 'Can I delete a room?',
        a: 'Yes, room owners (creators) can delete their rooms. Go to the Dashboard → My Rooms and click the Delete button on any room card. Joining participants cannot delete rooms they didn\'t create.'
      },
    ]
  },
  {
    category: 'Account & Security',
    icon: Book,
    items: [
      {
        q: 'How do I reset my password?',
        a: 'Currently DevMeet uses credentials-based auth. Password reset via email is coming soon. For now, contact support if you\'re locked out.'
      },
      {
        q: 'Is my code stored on DevMeet servers?',
        a: 'Room sessions are powered by Liveblocks. Code written in a room is synced in real-time but is not permanently stored — when all participants leave, the session ends. Your room metadata (ID, participants) is stored in MongoDB.'
      },
      {
        q: 'Can I use DevMeet without signing in?',
        a: 'Currently all features require an account. We plan to add guest/preview access in a future release.'
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Danger Zone → Delete Account. You will need to type "DELETE" to confirm. This action is irreversible and removes all your data.'
      },
    ]
  },
];

const card: React.CSSProperties = { background: 'var(--dm-card)', border: '1px solid var(--dm-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' };

export default function HelpPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: '800px', margin: '0 auto', color: 'var(--dm-text)' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
          Help & <span style={{ color: '#34d399' }}>FAQ</span>
        </h1>
        <p style={{ color: 'var(--dm-muted)', fontSize: '14px', margin: '6px 0 0' }}>
          Frequently asked questions about DevMeet
        </p>
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '40px' }}>
        {[
          { icon: Zap,          label: 'Getting Started',     href: '#getting-started' },
          { icon: MessageSquare,label: 'Rooms & Collab',       href: '#rooms' },
          { icon: Book,         label: 'Account & Security',  href: '#account' },
        ].map((l, i) => (
          <a key={i} href={l.href}
            style={{ ...card, padding: '16px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: 0, transition: 'border-color 150ms' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <l.icon style={{ width: '16px', height: '16px', color: '#34d399' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dm-text)' }}>{l.label}</span>
          </a>
        ))}
      </div>

      {/* FAQ sections */}
      {faqs.map((section, si) => (
        <div key={si} id={section.category.toLowerCase().replace(/\s+/g, '-')} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <section.icon style={{ width: '15px', height: '15px', color: '#34d399' }} />
            <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dm-muted)', margin: 0 }}>
              {section.category}
            </h2>
          </div>

          <div style={card}>
            {section.items.map((item, qi) => {
              const key = `${si}-${qi}`;
              const isOpen = !!open[key];
              return (
                <div key={qi} style={{ borderBottom: qi < section.items.length - 1 ? '1px solid var(--dm-border)' : 'none' }}>
                  <button onClick={() => toggle(key)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dm-text)', flex: 1 }}>{item.q}</span>
                    {isOpen
                      ? <ChevronUp style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                      : <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--dm-muted)', flexShrink: 0 }} />
                    }
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 20px 18px', fontSize: '14px', color: 'var(--dm-muted)', lineHeight: 1.7 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Contact */}
      <div style={{ ...card, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(52,211,153,0.04)', borderColor: 'rgba(52,211,153,0.15)', marginBottom: 0 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '15px', margin: 0 }}>Still need help?</p>
          <p style={{ color: 'var(--dm-muted)', fontSize: '13px', margin: '4px 0 0' }}>Reach out and we&apos;ll get back to you.</p>
        </div>
        <a href="mailto:support@devmeet.app"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
          <MessageSquare style={{ width: '15px', height: '15px' }} /> Contact Support
        </a>
      </div>
    </div>
  );
}
