import type { IPracticeAttempt } from '@devmeet/shared';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface AttemptHistoryProps {
  attempts: IPracticeAttempt[];
  onSelect: (attempt: IPracticeAttempt) => void;
  selectedId?: string;
}

export default function AttemptHistory({ attempts, onSelect, selectedId }: AttemptHistoryProps) {
  if (attempts.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#78716c', fontSize: '14px' }}>
        No attempts yet. Run your code to see history.
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 style={{ color: '#34d399', width: '16px', height: '16px' }} />;
      case 'failed':
      case 'runtime_error':
      case 'compile_error': return <XCircle style={{ color: '#f87171', width: '16px', height: '16px' }} />;
      case 'timeout': return <Clock style={{ color: '#fbbf24', width: '16px', height: '16px' }} />;
      case 'queued':
      case 'running': return <Loader2 style={{ color: '#60a5fa', width: '16px', height: '16px' }} className="animate-spin" />;
      default: return <AlertCircle style={{ color: '#a8a29e', width: '16px', height: '16px' }} />;
    }
  };
  
  // Need loader icon
  const Loader2 = ({ style, className }: any) => (
    <svg style={style} className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', borderLeft: '4px solid var(--dm-border)', background: 'var(--dm-bg)' }}>
      <div style={{ padding: '16px', borderBottom: '4px solid var(--dm-border)', background: 'var(--dm-surface)' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'white', fontFamily: '"Space Grotesk", system-ui, sans-serif', textTransform: 'uppercase' }}>Attempt History</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {attempts.map(attempt => (
          <div
            key={attempt._id}
            onClick={() => onSelect(attempt)}
            style={{
              padding: '12px 16px',
              borderBottom: '4px solid var(--dm-border)',
              cursor: 'pointer',
              background: attempt._id === selectedId ? 'rgba(52,211,153,0.05)' : 'transparent',
              transition: 'background 150ms'
            }}
            onMouseEnter={(e) => {
              if (attempt._id !== selectedId) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            }}
            onMouseLeave={(e) => {
              if (attempt._id !== selectedId) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getStatusIcon(attempt.status)}
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>
                  {attempt.status.replace('_', ' ')}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#78716c' }}>
                {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#a8a29e' }}>{attempt.language}</span>
              {attempt.executionTimeMs ? (
                <span style={{ fontSize: '12px', color: '#a8a29e' }}>{attempt.executionTimeMs}ms</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
