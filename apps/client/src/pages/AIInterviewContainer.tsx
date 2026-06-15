import { useEffect, useState } from 'react';
import type { IRoom, IProblem } from '@devmeet/shared';
import AIInterviewLayout from '../components/ai-interview/AIInterviewLayout';
import AIInterviewSetup from '../components/ai-interview/AIInterviewSetup';
import { problemService } from '../services/problemService';
import { aiInterviewService } from '../services/aiInterviewService';

interface AIInterviewContainerProps {
  room: IRoom;
}

export default function AIInterviewContainer({ room }: AIInterviewContainerProps) {
  const [problem, setProblem] = useState<IProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [needsSetup, setNeedsSetup] = useState(!room.problemId || !room.interviewSessionId);

  const fetchProblem = async (probId: string) => {
    try {
      if (!room.interviewSessionId) {
        await aiInterviewService.createSession({ roomId: room.roomId, problemId: probId, durationMinutes: 45 });
        window.dispatchEvent(new CustomEvent('roomProblemUpdated'));
        return;
      }
      const data = await problemService.getProblem(probId);
      setProblem(data);
      setNeedsSetup(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load problem or create session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (room.problemId) {
      fetchProblem(room.problemId as string);
    } else {
      setLoading(false);
    }
  }, [room.problemId]);

  if (loading) return <div style={{ color: 'white', padding: '24px', display: 'flex', justifyContent: 'center', height: '100vh', alignItems: 'center' }}>Loading AI Interview...</div>;
  if (error) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dm-bg)' }}>
      <div style={{ background: '#18181b', padding: '32px', borderRadius: '12px', border: '1px solid #3f3f46', maxWidth: '400px', textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444', margin: '0 0 12px 0', fontSize: '18px' }}>Setup Failed</h3>
        <p style={{ color: '#a1a1aa', margin: '0 0 24px 0', fontSize: '14px', lineHeight: 1.5 }}>{error}</p>
        <button onClick={() => window.location.href='/dashboard'} style={{ padding: '8px 16px', background: 'white', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Return to Dashboard</button>
      </div>
    </div>
  );

  if (needsSetup) {
    return <AIInterviewSetup room={room} onSetupComplete={() => window.location.reload()} />;
  }

  if (!problem) return null;

  return <AIInterviewLayout room={room} problem={problem} />;
}
