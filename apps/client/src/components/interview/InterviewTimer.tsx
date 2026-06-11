import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import type { InterviewStatus } from '@devmeet/shared';

interface InterviewTimerProps {
  status: InterviewStatus;
  expiresAt: string | null;
  onExpire?: () => void;
}

export default function InterviewTimer({ status, expiresAt, onExpire }: InterviewTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (status !== 'active' || !expiresAt) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    // Initial calculation
    const initial = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    setTimeLeft(initial);

    return () => clearInterval(interval);
  }, [status, expiresAt, onExpire]);

  if (status === 'scheduled') {
    return <div style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Timer size={16}/> Not started</div>;
  }
  if (status === 'completed' || status === 'cancelled') {
    return <div style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Timer size={16}/> Finished</div>;
  }
  if (status === 'expired' || (status === 'active' && timeLeft === 0)) {
    return <div style={{ color: '#f87171', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Timer size={16}/> Time's up</div>;
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const isLow = timeLeft < 300; // < 5 mins

  return (
    <div style={{ color: isLow ? '#f87171' : '#34d399', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Timer size={16} />
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{minutes}:{seconds}</span>
    </div>
  );
}
