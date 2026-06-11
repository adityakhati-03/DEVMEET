import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--dm-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <h1 style={{ fontSize: '72px', fontWeight: 900, color: '#34d399', margin: 0 }}>404</h1>
      <p style={{ color: 'var(--dm-muted)', fontSize: '18px' }}>This page doesn&apos;t exist.</p>
      <Link to="/" style={{ padding: '10px 24px', background: '#34d399', color: '#080a0f', borderRadius: '8px', fontWeight: 700, fontSize: '14px' }}>
        Go Home
      </Link>
    </div>
  );
}
