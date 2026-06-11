import { useState } from 'react';
import type { GeneratedTestCase } from '@devmeet/shared';
import TestCaseTypeBadge from './TestCaseTypeBadge';
import { Play, Plus, Save, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { testCaseService } from '../../services/testCaseService';
import { toast } from 'sonner';

interface GeneratedTestCaseListProps {
  testCases: GeneratedTestCase[];
  generationId: string;
  problemId?: string;
  canSave?: boolean;
  onUseAsInput?: (input: string) => void;
}

export default function GeneratedTestCaseList({
  testCases,
  generationId,
  problemId,
  canSave = false,
  onUseAsInput,
}: GeneratedTestCaseListProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [saving, setSaving] = useState(false);

  const toggleExpand = (idx: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  const handleSaveOne = async (tc: GeneratedTestCase) => {
    if (!problemId) return;
    setSaving(true);
    try {
      const result = await testCaseService.saveGeneratedTestCases({
        generationId,
        problemId,
        testCases: [tc],
        saveAsHidden: tc.hidden,
      });
      toast.success(`Saved ${result.saved} test case to problem`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save test case');
    } finally {
      setSaving(false);
    }
  };

  if (testCases.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#71717a', padding: '20px', fontSize: '14px' }}>
        No test cases generated.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {testCases.map((tc, idx) => (
        <div
          key={idx}
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {/* Header Row */}
          <div
            onClick={() => toggleExpand(idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {expanded.has(idx) ? <ChevronDown size={14} color="#71717a" /> : <ChevronRight size={14} color="#71717a" />}
            <span style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: 600 }}>
              Case #{idx + 1}
            </span>
            <TestCaseTypeBadge type={tc.type} />
            {tc.hidden && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f59e0b' }}>
                <EyeOff size={11} /> Hidden
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              {onUseAsInput && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUseAsInput(tc.input); }}
                  title="Use as Custom Input"
                  style={btnStyle('#3f3f46')}
                >
                  <Plus size={12} /> Use
                </button>
              )}
              {canSave && problemId && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSaveOne(tc); }}
                  disabled={saving}
                  title="Save to Problem"
                  style={btnStyle('#1e3a5f')}
                >
                  <Save size={12} /> Save
                </button>
              )}
            </div>
          </div>

          {/* Expanded Body */}
          {expanded.has(idx) && (
            <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={labelStyle}>Input</label>
                <pre style={preStyle}>{tc.input}</pre>
              </div>
              <div>
                <label style={labelStyle}>Expected Output</label>
                <pre style={{ ...preStyle, color: tc.hidden && tc.expectedOutput === '[hidden]' ? '#71717a' : '#86efac' }}>
                  {tc.expectedOutput}
                </pre>
              </div>
              {tc.explanation && (
                <div>
                  <label style={labelStyle}>Explanation</label>
                  <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa', lineHeight: 1.5 }}>{tc.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const btnStyle = (bg: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 10px',
  background: bg,
  border: 'none',
  borderRadius: '5px',
  color: 'white',
  fontSize: '12px',
  cursor: 'pointer',
  fontWeight: 500,
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#71717a',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px',
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: '8px 12px',
  background: '#09090b',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: 'monospace',
  color: '#d4d4d8',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: '120px',
  overflowY: 'auto',
};
