import type { IRoom } from '@devmeet/shared';
import { Bot, TerminalSquare } from 'lucide-react';
import AIProblemBuilderButton from '../ai-problem-builder/AIProblemBuilderButton';

interface ProblemSelectorProps {
  room: IRoom;
  onSelect: (problemId: string) => void;
}

export default function ProblemSelector({ room, onSelect }: ProblemSelectorProps) {
  return (
    <div style={{ minHeight: '100vh', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <div className="dm-card animate-slide-up" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '48px 32px' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 16px 0', color: 'white', fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Practice Environment
          </h2>
          <p style={{ color: '#a8a29e', margin: 0, fontSize: '15px', fontFamily: '"JetBrains Mono", monospace' }}>
            Choose how you want to begin your practice session.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            {/* We make the AIProblemBuilderButton fill the container by wrapping it or modifying it. 
                Since AIProblemBuilderButton renders a button itself, we might need a wrapper. */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AIProblemBuilderButton 
                roomId={room.roomId}
                mode={room.mode}
                interviewType={room.interviewType}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#78716c', marginTop: '12px', fontFamily: '"JetBrains Mono", monospace' }}>
              Generate a custom, highly-specific coding challenge using AI.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '2px', background: 'var(--dm-border)' }} />
            <span style={{ color: '#78716c', fontSize: '12px', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>OR</span>
            <div style={{ flex: 1, height: '2px', background: 'var(--dm-border)' }} />
          </div>

          <button 
            onClick={() => onSelect('blank')}
            className="dm-btn-ghost"
            style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '16px', width: '100%' }}
          >
            <TerminalSquare size={20} />
            Continue Without Problem
          </button>
        </div>
        
      </div>
    </div>
  );
}
