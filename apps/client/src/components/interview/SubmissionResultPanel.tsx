import type { IInterviewSubmission } from '@devmeet/shared';
import { XCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SubmissionResultPanelProps {
  submission: IInterviewSubmission | null;
  onClose: () => void;
}

export default function SubmissionResultPanel({ submission, onClose }: SubmissionResultPanelProps) {
  if (!submission) return null;

  const isRunning = submission.status === 'queued' || submission.status === 'running';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#34d399';
      case 'wrong_answer': return '#f87171';
      case 'compile_error': return '#fcd34d';
      case 'runtime_error': return '#f87171';
      case 'timeout': return '#fb923c';
      case 'running': 
      case 'queued': return '#60a5fa';
      default: return '#9ca3af';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', width: '400px', maxHeight: '60vh', background: 'var(--dm-surface)', border: '4px solid var(--dm-border)', borderRadius: '0px', display: 'flex', flexDirection: 'column', boxShadow: '8px 8px 0px rgba(0,0,0,1)', zIndex: 100 }}>
      <div style={{ padding: '16px', borderBottom: '4px solid var(--dm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Space Grotesk", system-ui, sans-serif', textTransform: 'uppercase' }}>
          {isRunning ? <Loader2 className="animate-spin" size={18} color={getStatusColor(submission.status)} /> : 
           submission.status === 'accepted' ? <CheckCircle size={18} color={getStatusColor(submission.status)} /> : 
           <XCircle size={18} color={getStatusColor(submission.status)} />}
          Submission Result
        </h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
          <XCircle size={20} />
        </button>
      </div>
      
      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: getStatusColor(submission.status) }}>
            {getStatusText(submission.status)}
          </div>
          {!isRunning && (
            <div style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '4px' }}>
              {submission.passedTests} / {submission.totalTests} test cases passed.
            </div>
          )}
        </div>

        {!isRunning && submission.visibleResults && submission.visibleResults.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#9ca3af', fontFamily: '"JetBrains Mono", monospace' }}>Visible Test Cases</h4>
            {submission.visibleResults.map((tc, idx) => (
              <div key={idx} style={{ marginBottom: '12px', padding: '12px', background: tc.passed ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)', border: `4px solid ${tc.passed ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: '0px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: tc.passed ? '#34d399' : '#f87171', marginBottom: '8px', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase' }}>
                  Test Case {idx + 1}: {tc.passed ? 'Passed' : 'Failed'}
                </div>
                <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                  <div style={{ marginBottom: '4px' }}><strong style={{ color: '#94a3b8' }}>Input:</strong> {tc.input}</div>
                  <div style={{ marginBottom: '4px' }}><strong style={{ color: '#94a3b8' }}>Expected:</strong> {tc.expectedOutput}</div>
                  <div style={{ marginBottom: '4px' }}><strong style={{ color: '#94a3b8' }}>Output:</strong> {tc.actualOutput}</div>
                  {tc.stderr && <div style={{ color: '#f87171', marginTop: '8px' }}><strong style={{ color: '#94a3b8' }}>Stderr:</strong><br/>{tc.stderr}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isRunning && submission.hiddenSummary && submission.hiddenSummary.total > 0 && (
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '0px', border: '4px solid var(--dm-border)' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#9ca3af', fontFamily: '"JetBrains Mono", monospace' }}>Hidden Test Cases</h4>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
              <div>Passed: <span style={{ color: '#34d399' }}>{submission.hiddenSummary.passed}</span> / {submission.hiddenSummary.total}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
