import { useState, useEffect } from 'react';
import { interviewService } from '../../services/interviewService';
import type { InterviewReport } from '@devmeet/shared';
import { XCircle, Loader2 } from 'lucide-react';

interface InterviewReportModalProps {
  sessionId: string;
  onClose: () => void;
}

export default function InterviewReportModal({ sessionId, onClose }: InterviewReportModalProps) {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewService.getReport(sessionId)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '800px', maxHeight: '90vh', background: '#080a0f', borderRadius: '16px', border: '1px solid var(--dm-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--dm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 700 }}>Interview Report</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <XCircle size={20} />
          </button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin text-emerald-400" /></div>
          ) : !report ? (
            <div style={{ textAlign: 'center', color: '#f87171' }}>Failed to load report.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              <div>
                <h3 style={{ color: '#34d399', fontSize: '15px', fontWeight: 600, margin: '0 0 12px' }}>Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--dm-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--dm-border)' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Status</div>
                    <div style={{ fontSize: '14px', color: 'white', fontWeight: 600 }}>{report.session.status.toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Problem</div>
                    <div style={{ fontSize: '14px', color: 'white', fontWeight: 600 }}>{report.problem?.title || 'None'}</div>
                  </div>
                </div>
              </div>

              {report.session.notes && (
                <div>
                  <h3 style={{ color: '#34d399', fontSize: '15px', fontWeight: 600, margin: '0 0 12px' }}>Interviewer Notes</h3>
                  <div style={{ background: 'var(--dm-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--dm-border)', color: '#d1d5db', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                    {report.session.notes}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ color: '#34d399', fontSize: '15px', fontWeight: 600, margin: '0 0 12px' }}>Submissions</h3>
                {report.submissions.length === 0 ? (
                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>No submissions made.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {report.submissions.map((sub: any, i: number) => (
                      <div key={sub._id} style={{ background: 'var(--dm-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--dm-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'white' }}>Submission {i + 1}</span>
                          <span style={{ color: sub.status === 'accepted' ? '#34d399' : '#f87171', fontWeight: 600, fontSize: '13px' }}>
                            {sub.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                          Language: {sub.language} | Passed: {sub.passedTests}/{sub.totalTests} | Hidden: {sub.hiddenSummary?.passed}/{sub.hiddenSummary?.total}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ color: '#34d399', fontSize: '15px', fontWeight: 600, margin: '0 0 12px' }}>Event Log</h3>
                <div style={{ background: 'var(--dm-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--dm-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {report.events.map((ev: any) => (
                    <div key={ev._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#d1d5db' }}>{ev.type}</span>
                      <span style={{ color: '#9ca3af', fontFamily: 'monospace' }}>{new Date(ev.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
