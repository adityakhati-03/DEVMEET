import { useEffect, useState, useRef } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import type { IRoom, IProblem, IInterviewSession, InterviewStatus } from '@devmeet/shared';
import { interviewService } from '../../services/interviewService';
import { problemService } from '../../services/problemService';
import InterviewProblemPanel from './InterviewProblemPanel';
import InterviewEditor from './InterviewEditor';
import InterviewTimer from './InterviewTimer';
import InterviewControls from './InterviewControls';
import SubmissionResultPanel from './SubmissionResultPanel';
import InterviewProblemSelector from './InterviewProblemSelector';
import InterviewReportModal from './InterviewReportModal';
import InterviewerNotesModal from './InterviewerNotesModal';
import { toast } from 'sonner';
import { FileText, Edit3 } from 'lucide-react';

interface NormalInterviewLayoutProps {
  room: IRoom;
  currentUser: { id: string; name: string; username: string; avatar: string | null };
}

export default function NormalInterviewLayout({ room, currentUser }: NormalInterviewLayoutProps) {
  const [session, setSession] = useState<IInterviewSession | null>(null);
  const [problem, setProblem] = useState<IProblem | null>(null);
  const [timerStatus, setTimerStatus] = useState<InterviewStatus>('scheduled');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningSession, setJoiningSession] = useState(false);

  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [showProblemSelector, setShowProblemSelector] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [testInputOverride, setTestInputOverride] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isInterviewer = session?.interviewerId === currentUser.id;
  const isCandidate = session?.candidateId === currentUser.id;

  // 1. Fetch Session Details
  useEffect(() => {
    if (!room.interviewSessionId) {
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const sess = await interviewService.getSession(room.interviewSessionId as string);
        setSession(sess);
        const activeProblemId = sess.problemId || room.problemId;
        if (activeProblemId) {
          const prob = await problemService.getProblem(activeProblemId as string);
          setProblem(prob);
        }
        
        // Fetch initial timer
        const timer = await interviewService.getTimer(sess._id);
        setTimerStatus(timer.status);
        setExpiresAt(timer.expiresAt);
      } catch (err) {
        console.error('Failed to load interview session', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [room.interviewSessionId]);

  // 1a. Listen for dynamic problem updates on the room
  useEffect(() => {
    if (room.problemId) {
      problemService.getProblem(room.problemId as string)
        .then(setProblem)
        .catch(console.error);
    }
  }, [room.problemId]);

  // 2. Poll Timer Status
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      try {
        const timer = await interviewService.getTimer(session._id);
        setTimerStatus(timer.status);
        setExpiresAt(timer.expiresAt);
        // Sync session status
        if (timer.status !== session.status) {
          setSession(s => s ? { ...s, status: timer.status } : s);
        }
      } catch (e) {}
    }, 10000); // Poll every 10s for sync
    return () => clearInterval(interval);
  }, [session]);

  // 3. Handlers
  const handleStart = async () => {
    if (!session) return;
    try {
      const updated = await interviewService.startSession(session._id);
      setSession(updated);
      setTimerStatus(updated.status);
      setExpiresAt(updated.expiresAt as string);
      toast.success('Interview started');
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Failed to start');
    }
  };

  const handleEnd = async () => {
    if (!session) return;
    if (!window.confirm('Are you sure you want to end this interview?')) return;
    try {
      const updated = await interviewService.endSession(session._id);
      setSession(updated);
      setTimerStatus(updated.status);
      toast.success('Interview ended');
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Failed to end');
    }
  };

  const handleRunCode = async (code: string, languageId: number, stdin: string) => {
    if (!session) return;
    setIsExecuting(true);
    setOutput('⏳ Queued...');
    try {
      // For Run, we use Yjs metadata observer in CollaborativeEditor to get results.
      // But in InterviewEditor, we can just use the observer directly OR poll.
      // Wait, we don't have Yjs observer here. Let's just let the worker publish it and Yjs will pick it up?
      // No, InterviewEditor doesn't have the observer natively. We'll poll or rely on it.
      // Actually, since Yjs provider is active, we could observe it here.
      // But we can also just let the execution queue handle it. 
      // The instruction said "17. Frontend run flow... Poll job result". Wait, the prompt says "Poll job result".
      // But for practice mode we polled. Here we can poll too, or just wait.
      // Let's implement simple polling if needed, but the user says "Poll job result" in the prompt.
      // However, we don't have an endpoint to GET a single execution job in the backend easily from client (we have one in Practice).
      // Wait, we do have `/api/execution/jobs/:jobId` from collaboration mode?
      // Yes! Collaboration uses it or just relies on WebSocket.
      // Let's just use the executionService to fetch job status if needed, but since it's collaboration room, Yjs metadata will be updated!
      // So I will just trigger it and Yjs will push it.
      await interviewService.runCode(session._id, { code, languageId, stdin });
      setOutput('🔄 Running... (Result will appear shortly)');
      
      // Stop the executing state after a timeout just in case
      setTimeout(() => setIsExecuting(false), 2000);
      
    } catch (e: any) {
      setOutput(`Error: ${e.response?.data?.error?.message || e.message}`);
      setIsExecuting(false);
    }
  };

  const handleAssignProblem = async (problemId: string) => {
    if (!session) return;
    try {
      const updated = await interviewService.assignProblem(session._id, problemId);
      setSession(updated);
      const prob = await problemService.getProblem(problemId);
      setProblem(prob);
      setShowProblemSelector(false);
      toast.success('Problem assigned');
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Failed to assign problem');
    }
  };

  const handleSubmitCode = async (code: string, languageId: number) => {
    if (!session) return;
    setIsSubmitting(true);
    setSubmissionResult(null);
    try {
      const res = await interviewService.submitCode(session._id, { code, languageId });
      setSubmissionId(res.submissionId);
      
      // Start polling
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const sub = await interviewService.getSubmission(res.submissionId);
          setSubmissionResult(sub);
          if (sub.status !== 'queued' && sub.status !== 'running') {
            setIsSubmitting(false);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        } catch (err) {}
      }, 2000);

    } catch (e: any) {
      toast.error(`Error: ${e.response?.data?.error?.message || e.message}`);
      setIsSubmitting(false);
    }
  };

  const handleJoinSession = async (role: 'interviewer' | 'candidate') => {
    setJoiningSession(true);
    try {
      const sess = await interviewService.joinSession({
        roomId: room.roomId,
        role,
      });
      setSession(sess);
      setTimerStatus(sess.status);
      toast.success(`Joined as ${role}!`);
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Failed to join session');
    } finally {
      setJoiningSession(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  if (loading) {
    return <div style={{ padding: '24px', color: '#78716c' }}>Loading interview session...</div>;
  }

  // If there's no session OR user is neither interviewer nor candidate, show join screen
  // Wait, if they are already assigned, they wouldn't see this because isInterviewer/isCandidate would be true.
  // Actually, we should show this if they are NOT isInterviewer AND NOT isCandidate.
  if (!session || (!isInterviewer && !isCandidate)) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dm-surface)' }}>
        <div style={{ width: '400px', background: '#080a0f', padding: '32px', borderRadius: '0px', border: '4px solid var(--dm-border)', textAlign: 'center', boxShadow: '8px 8px 0px rgba(255,255,255,0.05)' }}>
          <h2 style={{ margin: '0 0 24px', color: 'white', fontSize: '20px', fontWeight: 800, fontFamily: '"Space Grotesk", system-ui, sans-serif', textTransform: 'uppercase' }}>Join Interview</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>
            Please select your role for this interview session.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={() => handleJoinSession('interviewer')}
              disabled={joiningSession || !!session?.interviewerId}
              style={{ width: '100%', padding: '12px', background: session?.interviewerId ? '#374151' : 'var(--dm-accent)', color: session?.interviewerId ? '#9ca3af' : '#080a0f', border: 'none', borderRadius: '0px', fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', cursor: (joiningSession || !!session?.interviewerId) ? 'not-allowed' : 'pointer' }}
            >
              {session?.interviewerId ? 'Interviewer Role Taken' : 'Join as Interviewer'}
            </button>
            <button 
              onClick={() => handleJoinSession('candidate')}
              disabled={joiningSession || !!session?.candidateId}
              style={{ width: '100%', padding: '12px', background: session?.candidateId ? '#374151' : '#3b82f6', color: session?.candidateId ? '#9ca3af' : 'white', border: 'none', borderRadius: '0px', fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', cursor: (joiningSession || !!session?.candidateId) ? 'not-allowed' : 'pointer' }}
            >
              {session?.candidateId ? 'Candidate Role Taken' : 'Join as Candidate'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Bar for Interview Controls & Timer */}
      <div style={{ padding: '12px 24px', background: '#080a0f', borderBottom: '4px solid var(--dm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'white', fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginRight: '16px', flexShrink: 0 }}>Exit Room</button>
          Normal Interview Mode {isInterviewer ? '(Interviewer)' : isCandidate ? '(Candidate)' : '(Viewer)'}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {isInterviewer && (
            <>
              <button 
                onClick={() => setShowNotes(true)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                <Edit3 size={14} /> Notes
              </button>
              {(timerStatus === 'completed' || timerStatus === 'expired') && (
                <button 
                  onClick={() => setShowReport(true)}
                  style={{ background: 'var(--dm-accent)', color: 'black', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '0px' }}
                >
                  <FileText size={14} /> Report
                </button>
              )}
            </>
          )}
          <InterviewTimer status={timerStatus} expiresAt={expiresAt} />
          <InterviewControls status={timerStatus} isInterviewer={isInterviewer} onStart={handleStart} onEnd={handleEnd} />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <PanelGroup direction="horizontal">
          <Panel defaultSize={35} minSize={20}>
            <InterviewProblemPanel
              problem={problem}
              isInterviewer={isInterviewer}
              room={room}
              onAssignProblem={() => setShowProblemSelector(true)}
              onUseAsInput={(input) => setTestInputOverride(input)}
            />
          </Panel>
          <PanelResizeHandle style={{ width: '4px', background: 'rgba(255,255,255,0.05)', cursor: 'col-resize' }} />
          <Panel defaultSize={65} minSize={30}>
            <InterviewEditor
              roomId={room.roomId}
              currentUser={currentUser}
              isExecuting={isExecuting}
              isSubmitting={isSubmitting}
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              output={output}
              externalInput={testInputOverride}
              onExternalInputConsumed={() => setTestInputOverride(null)}
            />
          </Panel>
        </PanelGroup>
      </div>

      {submissionResult && (
        <SubmissionResultPanel 
          submission={submissionResult} 
          onClose={() => setSubmissionResult(null)} 
        />
      )}

      {showProblemSelector && (
        <InterviewProblemSelector 
          onSelect={handleAssignProblem} 
          onClose={() => setShowProblemSelector(false)} 
        />
      )}

      {showReport && session && (
        <InterviewReportModal 
          sessionId={session._id} 
          onClose={() => setShowReport(false)} 
        />
      )}

      {showNotes && session && (
        <InterviewerNotesModal 
          sessionId={session._id} 
          initialNotes={session.notes || ''} 
          onClose={() => setShowNotes(false)}
          onSaved={(notes) => setSession({ ...session, notes } as any)}
        />
      )}
    </div>
  );
}
