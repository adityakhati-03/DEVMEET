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
          background: 'rgba(52, 211, 153, 0.1)',
          color: '#34d399',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          borderRadius: '8px',
          fontSize: compact ? '12px' : '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          width: compact ? 'auto' : '100%',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(52, 211, 153, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.2)';
          e.currentTarget.style.transform = 'none';
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
