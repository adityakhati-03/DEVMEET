import { useState } from 'react';
import { Sparkles } from 'lucide-react';
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
          padding: compact ? '6px 12px' : '8px 16px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
          color: '#60a5fa',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '8px',
          fontSize: compact ? '12px' : '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 10px rgba(99, 102, 241, 0.1)',
          width: compact ? 'auto' : '100%',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)';
          e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)';
          e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.3)';
        }}
      >
        <Sparkles size={compact ? 14 : 16} />
        {compact ? 'Build Problem' : 'AI Problem Builder'}
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
