import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }: LoadingSpinnerProps) {
  const containerStyle: React.CSSProperties = fullScreen
    ? { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dm-bg)' }
    : { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px', height: '40px', border: '4px solid var(--dm-border)',
          borderTopColor: 'var(--dm-accent)', borderRadius: '0',
          animation: 'spin 0.5s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{
          color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace',
          fontSize: '14px', textTransform: 'uppercase', fontWeight: 700
        }}>
          {message}
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
