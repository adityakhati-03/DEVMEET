import { useState } from 'react';
import type { IProblem, TestCaseGenerationMode } from '@devmeet/shared';
import GenerateTestCasesModal from './GenerateTestCasesModal';
import { Sparkles } from 'lucide-react';

interface GenerateTestCasesButtonProps {
  problem?: IProblem | null;
  roomId?: string;
  mode: TestCaseGenerationMode;
  interviewType?: 'normal' | 'ai' | null;
  isInterviewer?: boolean;
  canSave?: boolean;
  language?: string;
  onUseAsInput?: (input: string) => void;
  buttonLabel?: string;
  compact?: boolean;
}

export default function GenerateTestCasesButton({
  problem,
  roomId,
  mode,
  interviewType,
  isInterviewer = false,
  canSave = false,
  language,
  onUseAsInput,
  buttonLabel = 'Generate Test Cases',
  compact = false,
}: GenerateTestCasesButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="AI-powered test case generation"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: compact ? '4px' : '6px',
          padding: compact ? '5px 10px' : '8px 16px',
          background: 'rgba(124, 58, 237, 0.12)',
          border: '1px solid rgba(124, 58, 237, 0.4)',
          borderRadius: '8px',
          color: '#a78bfa',
          cursor: 'pointer',
          fontSize: compact ? '12px' : '13px',
          fontWeight: 600,
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124, 58, 237, 0.25)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124, 58, 237, 0.7)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124, 58, 237, 0.12)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124, 58, 237, 0.4)';
        }}
      >
        <Sparkles size={compact ? 12 : 14} />
        {buttonLabel}
      </button>

      <GenerateTestCasesModal
        isOpen={open}
        onClose={() => setOpen(false)}
        problem={problem}
        roomId={roomId}
        mode={mode}
        interviewType={interviewType}
        isInterviewer={isInterviewer}
        canSave={canSave}
        language={language}
        onUseAsInput={onUseAsInput}
      />
    </>
  );
}
