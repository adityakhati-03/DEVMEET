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
          padding: '6px 14px', borderRadius: '6px',
          background: '#34d399', color: '#080a0f',
          border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
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
          padding: '6px 14px', borderRadius: '6px',
          background: '#f87171', color: '#fff',
          border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
        }}
      >
        <Square size={14} /> End Interview
      </button>
    );
  }

  return null;
}
