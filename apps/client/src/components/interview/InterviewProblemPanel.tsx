import ReactMarkdown from 'react-markdown';
import type { IProblem, IRoom } from '@devmeet/shared';
import AIProblemBuilderButton from '../ai-problem-builder/AIProblemBuilderButton';

interface InterviewProblemPanelProps {
  problem: IProblem | null;
  isInterviewer: boolean;
  room?: IRoom | null;
  onAssignProblem?: () => void;
  onUseAsInput?: (input: string) => void;
  language?: string;
}

export default function InterviewProblemPanel({ problem, isInterviewer, room, onAssignProblem, onUseAsInput, language }: InterviewProblemPanelProps) {
  const getDifficultyColor = (diff: string) => {
    if (diff === 'easy') return '#34d399';
    if (diff === 'medium') return '#fbbf24';
    return '#f87171';
  };

  if (!problem) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--dm-surface)', borderRight: '4px solid var(--dm-border)', boxSizing: 'border-box' }}>
        <p style={{ color: '#78716c', marginBottom: '16px', fontFamily: '"JetBrains Mono", monospace' }}>No problem assigned yet.</p>
        {isInterviewer && room && (
          <div style={{ marginTop: '16px' }}>
            <AIProblemBuilderButton 
              roomId={room.roomId} 
              mode={room.mode} 
              interviewType={room.interviewType} 
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px', background: 'var(--dm-surface)', borderRight: '4px solid var(--dm-border)', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px', color: 'white' }}>
            {problem.title}
          </h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '0px', border: `2px solid ${getDifficultyColor(problem.difficulty)}`, color: getDifficultyColor(problem.difficulty), background: `${getDifficultyColor(problem.difficulty)}20`, fontFamily: '"JetBrains Mono", monospace' }}>
              {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
            </span>
            {problem.tags.map(tag => (
              <span key={tag} style={{ fontSize: '12px', color: '#a8a29e', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '0px', border: '2px solid var(--dm-border)', fontFamily: '"JetBrains Mono", monospace' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        {isInterviewer && room && (
          <div style={{ alignSelf: 'flex-start' }}>
            <AIProblemBuilderButton 
              roomId={room.roomId} 
              mode={room.mode} 
              interviewType={room.interviewType} 
              compact={true}
            />
          </div>
        )}
      </div>

      <div style={{ fontSize: '15px', lineHeight: 1.6, color: '#d6d3d1', marginBottom: '32px' }}>
        <ReactMarkdown>{problem.description}</ReactMarkdown>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {problem.examples.map((ex, i) => (
          <div key={i}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Example {i + 1}:</h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '4px solid var(--dm-border)', borderRadius: '0px', padding: '12px', fontSize: '14px', fontFamily: 'monospace', color: '#d6d3d1' }}>
              <div><strong style={{ color: '#a8a29e' }}>Input:</strong> {ex.input}</div>
              <div style={{ marginTop: '4px' }}><strong style={{ color: '#a8a29e' }}>Output:</strong> {ex.output}</div>
              {ex.explanation && (
                <div style={{ marginTop: '4px' }}><strong style={{ color: '#a8a29e' }}>Explanation:</strong> {ex.explanation}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {problem.constraints && problem.constraints.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Constraints:</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#d6d3d1', fontSize: '14px' }}>
            {problem.constraints.map((c, i) => (
              <li key={i} style={{ marginBottom: '4px', fontFamily: 'monospace' }}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {isInterviewer && room && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '4px solid var(--dm-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ padding: '4px', background: 'var(--dm-accent)', borderRadius: '0px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>AI Assistant</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <AIProblemBuilderButton
              roomId={room.roomId}
              mode={room.mode}
              interviewType={room.interviewType}
            />
          </div>
        </div>
      )}
    </div>
  );
}
