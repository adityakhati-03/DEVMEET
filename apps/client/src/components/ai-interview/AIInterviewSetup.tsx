import type { IRoom } from '@devmeet/shared';
import AIProblemBuilderButton from '../ai-problem-builder/AIProblemBuilderButton';

interface AIInterviewSetupProps {
  room: IRoom;
  onSetupComplete: () => void;
}

export default function AIInterviewSetup({ room }: AIInterviewSetupProps) {
  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--dm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#000', padding: '40px', borderRadius: '0px', border: '4px solid #fff', boxShadow: '8px 8px 0px 0px #fbbf24' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px', textAlign: 'center', fontFamily: 'monospace', textTransform: 'uppercase' }}>Setup AI Interview</h2>
        <p style={{ color: '#a1a1aa', textAlign: 'center', marginBottom: '40px', fontSize: '15px', lineHeight: 1.5, fontFamily: 'monospace' }}>
          You are entering an AI-evaluated Mock Interview. 
          Generate a custom interview scenario using the AI Builder to begin your session.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AIProblemBuilderButton
            roomId={room.roomId}
            mode={room.mode}
            interviewType={room.interviewType}
          />
        </div>
      </div>
    </div>
  );
}
