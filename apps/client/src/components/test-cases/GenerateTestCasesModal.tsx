import { useState, useEffect, useRef } from 'react';
import type { IProblem, TestCaseGenerationMode, GeneratedTestCase } from '@devmeet/shared';
import { testCaseService } from '../../services/testCaseService';
import GeneratedTestCaseList from './GeneratedTestCaseList';
import { X, Sparkles, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateTestCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem?: IProblem | null;
  roomId?: string;
  mode: TestCaseGenerationMode;
  interviewType?: 'normal' | 'ai' | null;
  isInterviewer?: boolean;
  canSave?: boolean;
  language?: string;
  onUseAsInput?: (input: string) => void;
}

export default function GenerateTestCasesModal({
  isOpen,
  onClose,
  problem,
  roomId,
  mode,
  interviewType,
  isInterviewer = false,
  canSave = false,
  language,
  onUseAsInput,
}: GenerateTestCasesModalProps) {
  const [problemDescription, setProblemDescription] = useState(problem?.description || '');
  const [count, setCount] = useState(5);
  const [includeEdgeCases, setIncludeEdgeCases] = useState(true);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<GeneratedTestCase[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (problem?.description) setProblemDescription(problem.description);
  }, [problem]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!problemDescription.trim()) {
      setError('Please provide a problem description.');
      return;
    }
    setLoading(true);
    setError(null);
    setTestCases([]);
    setGenerationId(null);

    try {
      const result = await testCaseService.generateTestCases({
        roomId,
        problemId: problem?._id,
        problemTitle: problem?.title,
        problemDescription: problemDescription.trim(),
        constraints: problem?.constraints,
        examples: problem?.examples,
        existingTestCases: problem?.testCases,
        language: language || 'any',
        count,
        includeEdgeCases,
        includeHidden: isInterviewer && includeHidden,
        mode,
        interviewType: interviewType ?? undefined,
      });
      setGenerationId(result.generationId);
      setTestCases(result.testCases);
      if (result.discarded > 0) {
        toast.warning(`${result.discarded} malformed test case(s) were discarded.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to generate test cases.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUseAsInput = (input: string) => {
    if (onUseAsInput) {
      onUseAsInput(input);
      toast.success('Input copied to editor input');
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{
        background: '#09090b', border: '1px solid #27272a', borderRadius: '16px',
        width: '100%', maxWidth: '640px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #18181b', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="#a78bfa" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>
              Generate Test Cases
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Problem description */}
          <div>
            <label style={labelStyle}>
              Problem Description {!problem && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {problem ? (
              <div style={{ fontSize: '13px', color: '#a1a1aa', background: '#18181b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #27272a', maxHeight: '80px', overflowY: 'auto', fontStyle: 'italic' }}>
                {problem.title} — using existing problem context
              </div>
            ) : (
              <textarea
                value={problemDescription}
                onChange={e => setProblemDescription(e.target.value)}
                placeholder="Paste the problem description here..."
                rows={5}
                style={{
                  width: '100%', padding: '10px 12px', background: '#18181b',
                  border: '1px solid #3f3f46', borderRadius: '8px', color: 'white',
                  fontSize: '13px', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Options row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>Count</label>
              <select
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                style={{ padding: '6px 10px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', color: 'white', fontSize: '13px' }}
              >
                {[3, 5, 8, 10, 15, 20].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Edge cases */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#d4d4d8' }}>
              <input
                type="checkbox"
                checked={includeEdgeCases}
                onChange={e => setIncludeEdgeCases(e.target.checked)}
                style={{ accentColor: '#a78bfa' }}
              />
              Include edge cases
            </label>

            {/* Hidden — only for authorized interviewers */}
            {isInterviewer && mode === 'interview' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#f59e0b' }}>
                <input
                  type="checkbox"
                  checked={includeHidden}
                  onChange={e => setIncludeHidden(e.target.checked)}
                  style={{ accentColor: '#f59e0b' }}
                />
                Include hidden test cases
              </label>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Generated list */}
          {testCases.length > 0 && generationId && (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#a1a1aa' }}>
                Generated <strong style={{ color: 'white' }}>{testCases.length}</strong> test cases:
              </p>
              <GeneratedTestCaseList
                testCases={testCases}
                generationId={generationId}
                problemId={problem?._id}
                canSave={canSave}
                onUseAsInput={onUseAsInput ? handleUseAsInput : undefined}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #18181b', flexShrink: 0, display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: '#27272a', border: 'none', borderRadius: '8px', color: '#a1a1aa', cursor: 'pointer', fontSize: '14px' }}>
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '9px 20px', background: loading ? '#4c1d95' : '#7c3aed',
              border: 'none', borderRadius: '8px', color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Sparkles size={15} />
            {loading ? 'Generating...' : testCases.length > 0 ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 700, color: '#71717a',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px',
};
