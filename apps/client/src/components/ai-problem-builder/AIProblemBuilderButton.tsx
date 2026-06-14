import { useState } from 'react';

import AIProblemBuilderModal from './AIProblemBuilderModal';

interface AIProblemBuilderButtonProps {
  roomId?: string;
  mode?: 'collaboration' | 'practice' | 'interview';
  interviewType?: 'normal' | 'ai' | null;
  compact?: boolean;
}

export default function AIProblemBuilderButton({ roomId, mode, interviewType, compact }: AIProblemBuilderButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? '6px' : '8px',
          padding: compact ? '6px 12px' : '10px 24px',
          background: '#000',
          color: '#fbbf24',
          border: '4px solid #fff',
          borderRadius: '0px',
          fontSize: compact ? '12px' : '13px',
          fontWeight: 700,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '4px 4px 0px 0px #fff',
          width: compact ? 'auto' : '100%',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#fbbf24';
          e.currentTarget.style.color = '#000';
          e.currentTarget.style.transform = 'translate(-2px, -2px)';
          e.currentTarget.style.boxShadow = '6px 6px 0px 0px #fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#000';
          e.currentTarget.style.color = '#fbbf24';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '4px 4px 0px 0px #fff';
        }}
      >
        {compact ? 'Build Problem' : '[AI] Problem Builder'}
      </button>

      {isModalOpen && (
        <AIProblemBuilderModal
          roomId={roomId}
          mode={mode}
          interviewType={interviewType}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
