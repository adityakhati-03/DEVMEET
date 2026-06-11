import ReactMarkdown from 'react-markdown';
import { ShieldAlert, Info, Code } from 'lucide-react';
import type { AIProblemBuilderResponse } from '@devmeet/shared';
import TestCaseTypeBadge from '../test-cases/TestCaseTypeBadge';

interface AIProblemPreviewProps {
  data: AIProblemBuilderResponse['problem'];
}

export default function AIProblemPreview({ data }: AIProblemPreviewProps) {
  const getDifficultyColor = (diff: string) => {
    if (diff === 'easy') return '#34d399';
    if (diff === 'medium') return '#fbbf24';
    return '#f87171';
  };

  return (
    <div style={{ padding: '24px', background: 'var(--dm-bg)', borderRadius: '12px', border: '1px solid var(--dm-border)', maxHeight: '60vh', overflowY: 'auto' }}>
      
      {data.sourceMetadata?.disclaimer && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', marginBottom: '24px' }}>
          <ShieldAlert size={16} color="#fbbf24" style={{ marginTop: '2px', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#fbbf24', lineHeight: 1.5 }}>
            {data.sourceMetadata.disclaimer}
          </span>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px', color: 'white' }}>
          {data.title}
        </h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', color: getDifficultyColor(data.difficulty), background: `${getDifficultyColor(data.difficulty)}20` }}>
            {data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1)}
          </span>
          {data.tags.map(tag => (
            <span key={tag} style={{ fontSize: '12px', color: '#a8a29e', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '15px', lineHeight: 1.6, color: '#d6d3d1', marginBottom: '32px' }}>
        <ReactMarkdown>{data.description}</ReactMarkdown>
      </div>

      {data.examples.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
          {data.examples.map((ex, i) => (
            <div key={i}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Example {i + 1}:</h3>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dm-border)', borderRadius: '8px', padding: '12px', fontSize: '14px', fontFamily: 'monospace', color: '#d6d3d1' }}>
                <div><strong style={{ color: '#a8a29e' }}>Input:</strong> {ex.input}</div>
                <div style={{ marginTop: '4px' }}><strong style={{ color: '#a8a29e' }}>Output:</strong> {ex.output}</div>
                {ex.explanation && (
                  <div style={{ marginTop: '4px' }}><strong style={{ color: '#a8a29e' }}>Explanation:</strong> {ex.explanation}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.constraints && data.constraints.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Constraints:</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#d6d3d1', fontSize: '14px' }}>
            {data.constraints.map((c, i) => (
              <li key={i} style={{ marginBottom: '4px', fontFamily: 'monospace' }}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code size={16} /> Starter Code Generated
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.keys(data.starterCode).map(lang => (
            <span key={lang} style={{ fontSize: '12px', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '4px 10px', borderRadius: '12px' }}>
              {lang}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} /> Test Cases
        </h3>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--dm-border)' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{data.visibleTestCases.length}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Visible Cases</div>
          </div>
          <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--dm-border)' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{data.hiddenTestCasesCount}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Hidden Cases (For Judges)</div>
          </div>
        </div>
        
        {data.visibleTestCases.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample Visible Cases</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.visibleTestCases.slice(0, 3).map((tc, i) => (
                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--dm-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>Test #{i + 1}</span>
                    {tc.type && <TestCaseTypeBadge type={tc.type} />}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#d6d3d1' }}>
                    <div style={{ marginBottom: '4px' }}><span style={{ color: '#78716c' }}>In:</span> {tc.input}</div>
                    <div><span style={{ color: '#78716c' }}>Out:</span> {tc.expectedOutput}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
