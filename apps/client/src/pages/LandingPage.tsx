import { Link } from 'react-router-dom';
import { Code2, Video, Globe, Zap } from 'lucide-react';
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
    icon: Zap,
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
      {/* Floating particles */}
      <div className="landing-particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="landing-particle"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Ambient radial gradients */}
      <div className="landing-glow-1" aria-hidden="true" />
      <div className="landing-glow-2" aria-hidden="true" />

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner animate-slide-up">
          {/* Beta badge */}
          <div className="dm-badge landing-badge">
            <span className="landing-badge-dot" />
            Open Beta
          </div>

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
              Get Started Free
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

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="page-wrapper landing-footer-inner">
          <div className="landing-footer-brand">
            <Zap size={16} color="var(--dm-accent)" />
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
