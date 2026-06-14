import { Play, Square } from 'lucide-react';
import type { InterviewStatus } from '@devmeet/shared';

interface InterviewControlsProps {
  status: InterviewStatus;
  isInterviewer: boolean;
  onStart: () => void;
  onEnd: () => void;
}

export default function InterviewControls({ status, isInterviewer, onStart, onEnd }: InterviewControlsProps) {
  if (!isInterviewer) return null;

  if (status === 'scheduled') {
    return (
      <button
        onClick={onStart}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '0px',
          background: 'var(--dm-accent)', color: '#080a0f',
          border: '4px solid transparent', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase'
        }}
      >
        <Play size={14} /> Start Interview
      </button>
    );
  }

  if (status === 'active' || status === 'expired') {
    return (
      <button
        onClick={onEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '0px',
          background: '#ef4444', color: '#fff',
          border: '4px solid #ef4444', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase'
        }}
      >
        <Square size={14} /> End Interview
      </button>
    );
  }

  return null;
}
