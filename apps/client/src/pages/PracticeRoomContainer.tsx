import { useEffect, useState } from 'react';
import type { IRoom, IProblem } from '@devmeet/shared';
import { practiceService } from '../services/practiceService';
import PracticeLayout from '../components/practice/PracticeLayout';
import ProblemSelector from '../components/practice/ProblemSelector';

interface PracticeRoomContainerProps {
  initialRoom: IRoom;
}

export default function PracticeRoomContainer({ initialRoom }: PracticeRoomContainerProps) {
  const [room, setRoom] = useState<IRoom>(initialRoom);
  const [problem, setProblem] = useState<IProblem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullData = async () => {
      try {
        const data = await practiceService.getPracticeRoom(room.roomId);
        setRoom(data.room);
        if (data.problem) {
          setProblem(data.problem as IProblem);
        }
      } catch (err) {
        console.error('Failed to load practice room details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [room.roomId]);

  const handleSelectProblem = async (problemId: string) => {
    try {
      const data = await practiceService.updatePracticeRoomProblem(room.roomId, problemId);
      setRoom(data.room);
      setProblem(data.problem as IProblem);
    } catch (err) {
      console.error('Failed to update problem', err);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080a0f' }}>
        <p style={{ color: '#78716c' }}>Loading practice environment...</p>
      </div>
    );
  }

  if (!room.problemId || !problem) {
    return (
      <div style={{ height: '100vh', overflowY: 'auto', background: '#080a0f' }}>
        <ProblemSelector onSelect={handleSelectProblem} />
      </div>
    );
  }

  return <PracticeLayout room={room} problem={problem} />;
}
