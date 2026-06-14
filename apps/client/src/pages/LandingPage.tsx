import { Link } from 'react-router-dom';
import { Code2, Video, Globe, Terminal } from 'lucide-react';
import DevMeetLogo from '../components/DevMeetLogo';
import './landing.css';

const features = [
  {
    icon: Code2,
    title: 'Collaborative Editor',
    description: 'Real-time Monaco editor with cursor tracking and live presence indicators.',
  },
  {
    icon: Video,
    title: 'Video Calls',
    description: 'Built-in HD video conferencing powered by Stream — zero setup required.',
  },
  {
    icon: Globe,
    title: '9+ Languages',
    description: 'Run JavaScript, Python, C++, Java, Go, Rust and more in the cloud.',
  },
  {
    icon: Terminal,
    title: 'Real-time Sync',
    description: 'Sub-100ms latency sync via WebSockets and CRDT conflict resolution.',
  },
];

const stats = [
  { value: '9+', label: 'Languages' },
  { value: '100ms', label: 'Sync Latency' },
  { value: 'Zero', label: 'Setup Required' },
];

// Generate deterministic positions for floating particles
const particles = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  top: `${(i * 37 + 7) % 100}%`,
  left: `${(i * 53 + 13) % 100}%`,
  size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
  delay: `${(i * 0.4) % 4}s`,
  duration: `${4 + (i % 4)}s`,
  opacity: 0.15 + (i % 5) * 0.06,
}));

export default function LandingPage() {
  return (
    <div className="landing-root">
      {/* Hero Section */}

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner animate-slide-up">
          {/* Beta badge removed as requested */}

          <h1 className="landing-headline">
            Code together,{' '}
            <span className="landing-headline-gradient">in real time</span>
          </h1>

          <p className="landing-sub">
            DevMeet is a collaborative platform for developers to write code together live,
            execute in 9+ languages, and communicate through built-in video calls — all in
            one tab.
          </p>

          <div className="landing-cta-group">
            <Link to="/signup" className="dm-btn-primary landing-btn-lg">
              Get Started
            </Link>
            <Link to="/login" className="dm-btn-ghost landing-btn-lg">
              Sign In
            </Link>
          </div>

          {/* Stats bar */}
          <div className="landing-stats">
            {stats.map((s, i) => (
              <div key={s.label} className="landing-stat">
                {i > 0 && <div className="landing-stat-divider" />}
                <span className="landing-stat-value">{s.value}</span>
                <span className="landing-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features-section">
        <div className="page-wrapper">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Everything you need to code together</h2>
            <p className="landing-section-sub">
              No plugins. No config. Just open a room and start writing.
            </p>
          </div>

          <div className="dm-grid-4 landing-features-grid">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="dm-card landing-feature-card">
                  <div className="landing-feature-icon-wrap">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3 className="landing-feature-title">{feat.title}</h3>
                  <p className="landing-feature-desc">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Deep Dive Info Section ── */}
      <section className="landing-info-section" style={{ padding: '80px 0', borderTop: '4px solid var(--dm-border)', background: 'var(--dm-bg)' }}>
        <div className="page-wrapper">
          <div className="dm-grid-2" style={{ alignItems: 'center', gap: '64px' }}>
            <div>
              <h2 style={{ fontSize: '36px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '-0.03em' }}>Built for the modern engineer</h2>
              <p style={{ fontSize: '18px', color: 'var(--dm-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                DevMeet isn't just another shared notepad. It is a fully fledged execution environment embedded directly in your browser. Whether you are conducting a technical interview, debugging a tricky algorithm with a friend, or practicing data structures, DevMeet provides the raw horsepower you need.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { title: 'AI Problem Generation', desc: 'Instantly generate LeetCode-style questions with test cases using our embedded AI.' },
                  { title: 'Cloud Execution Engine', desc: 'Compile and run your code securely in isolated Docker containers with sub-second latency.' },
                  { title: 'Frictionless Video', desc: 'No separate Zoom links. Start a high-definition video and audio call instantly within the room.' }
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '16px', background: 'var(--dm-card)', padding: '20px', border: '2px solid var(--dm-border)', borderRadius: '0px' }}>
                    <div style={{ width: '8px', background: 'var(--dm-accent)', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '16px', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}>{item.title}</strong>
                      <span style={{ fontSize: '14px', color: 'var(--dm-muted)' }}>{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: 'var(--dm-card)', border: '4px solid var(--dm-border)', padding: '32px', position: 'relative', boxShadow: '12px 12px 0 var(--dm-accent)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', borderBottom: '4px solid var(--dm-border)', background: 'var(--dm-surface)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', border: '2px solid var(--dm-border)' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#facc15', border: '2px solid var(--dm-border)' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#34d399', border: '2px solid var(--dm-border)' }} />
              </div>
              <pre style={{ margin: 0, paddingTop: '32px', fontFamily: '"JetBrains Mono", monospace', fontSize: '14px', color: 'var(--dm-text)', overflowX: 'hidden' }}>
                <code style={{ display: 'block', color: '#3b82f6' }}>const <span style={{ color: 'var(--dm-text)' }}>system</span> = new DevMeet();</code>
                <br/>
                <code style={{ display: 'block', color: 'var(--dm-muted)' }}>// Initialize ultra-low latency sync</code>
                <code style={{ display: 'block' }}>system.<span style={{ color: '#facc15' }}>connect</span>(&#123; mode: <span style={{ color: '#34d399' }}>'interview'</span> &#125;);</code>
                <br/>
                <code style={{ display: 'block', color: 'var(--dm-muted)' }}>// AI automatically generates problem context</code>
                <code style={{ display: 'block' }}>await system.<span style={{ color: '#facc15' }}>generateProblem</span>('Dynamic Programming');</code>
                <br/>
                <code style={{ display: 'block', color: '#ef4444' }}>&gt; Executing in secure sandbox...</code>
                <code style={{ display: 'block', color: '#34d399' }}>&gt; All 45 test cases passed. (12ms)</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="page-wrapper landing-footer-inner">
          <div className="landing-footer-brand">
            <DevMeetLogo size={20} />
            <span className="landing-footer-name">DevMeet</span>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} DevMeet. Built for developers.
          </p>
          <div className="landing-footer-links">
            <Link to="/login" className="landing-footer-link">Sign In</Link>
            <Link to="/signup" className="landing-footer-link">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
