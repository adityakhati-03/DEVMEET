import { useEffect, useState, useRef } from 'react';
import type { IRoom, IProblem, AIInterviewMessage, IInterviewSession, AIInterviewReport } from '@devmeet/shared';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import ProblemPanel from '../practice/ProblemPanel';
import AIInterviewEditor from './AIInterviewEditor';
import AIChatPanel from './AIChatPanel';
import AIReportPanel from './AIReportPanel';
import { aiInterviewService } from '../../services/aiInterviewService';
import { practiceService } from '../../services/practiceService';
import { SUPPORTED_LANGUAGES } from '@devmeet/shared';
import { toast } from 'sonner';
import GenerateTestCasesButton from '../test-cases/GenerateTestCasesButton';

interface AIInterviewLayoutProps {
  room: IRoom;
  problem: IProblem;
}

export default function AIInterviewLayout({ room, problem }: AIInterviewLayoutProps) {
  const [session, setSession] = useState<IInterviewSession | null>(null);
  const [messages, setMessages] = useState<AIInterviewMessage[]>([]);
  const [report, setReport] = useState<AIInterviewReport | null>(null);

  const [code, setCode] = useState(problem.starterCode?.javascript || '');
  const [language, setLanguage] = useState('JavaScript');
  const [inputValue, setInputValue] = useState('');
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        if (!room.interviewSessionId) {
          toast.error('No AI session attached to this room.');
          return;
        }

        const sessRes = await aiInterviewService.getSession(room.interviewSessionId as string);
        setSession(sessRes.session);

        if (sessRes.session.status === 'completed') {
          const repRes = await aiInterviewService.getReport(sessRes.session._id);
          setReport(repRes.report);
        }

        const msgRes = await aiInterviewService.getMessages(sessRes.session._id);
        setMessages(msgRes.messages);

        if (sessRes.session.status === 'scheduled') {
          const startRes = await aiInterviewService.startSession(sessRes.session._id);
          setSession(startRes.session);
          setMessages([startRes.message]);
        }
      } catch (err) {
        console.error('Failed to init AI session', err);
        toast.error('Failed to initialize AI interview.');
      }
    };
    initSession();
  }, [room.roomId, room.interviewSessionId]);

  useEffect(() => {
    if (!activeAttemptId) return;

    const poll = async () => {
      try {
        const attempt = await practiceService.getAttempt(activeAttemptId);
        
        if (['queued', 'running'].includes(attempt.status)) {
          pollingRef.current = setTimeout(poll, 1500);
        } else {
          setIsExecuting(false);
          setActiveAttemptId(null);
          
          let out = attempt.stdout || '';
          if (attempt.stderr) out += `\n\n[stderr]\n${attempt.stderr}`;
          if (!out.trim()) out = '(No output)';
          if (attempt.executionTimeMs) out += `\n\n⏱ ${attempt.executionTimeMs}ms`;
          
          if (attempt.status === 'failed' || attempt.status === 'compile_error' || attempt.status === 'runtime_error') {
            const prefix = attempt.status === 'compile_error' ? '🔴 Compile Error:' : '❌ Runtime Error:';
            setOutput(`${prefix}\n${out}`);
          } else if (attempt.status === 'timeout') {
            setOutput('⏱ Timed out. Check for infinite loops.');
          } else {
            setOutput(out);
          }
        }
      } catch (err) {
        setIsExecuting(false);
        setActiveAttemptId(null);
        setOutput('Error fetching execution status');
      }
    };

    pollingRef.current = setTimeout(poll, 1500);
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [activeAttemptId]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const l = lang.toLowerCase();
    let starter = '';
    if (l.includes('javascript')) starter = problem.starterCode?.javascript || '';
    else if (l.includes('python')) starter = problem.starterCode?.python || '';
    else if (l.includes('c++')) starter = problem.starterCode?.cpp || '';
    setCode(starter);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Code cannot be empty');
      return;
    }

    const langObj = SUPPORTED_LANGUAGES.find(l => l.name.toLowerCase().replace(/\s+/g, '') === language.toLowerCase().replace(/\s+/g, ''));
    if (!langObj) return;

    setIsExecuting(true);
    setShowOutput(true);
    setOutput('⏳ Running...');

    try {
      const res = await practiceService.runPracticeCode(room.roomId, {
        code,
        languageId: langObj.id,
        stdin: inputValue
      });
      setActiveAttemptId(res.attemptId);
    } catch (err: any) {
      setIsExecuting(false);
      setOutput(`Error: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!session || session.status === 'completed') return;
    setIsSubmitting(true);
    toast.info('Generating AI Evaluation Report...');
    try {
      // In a real flow, this would run hidden tests. 
      // For simplicity in this demo, we use the visible output as the execution summary,
      // or "Syntax/Runtime unknown" if they never ran it.
      const summary = output || 'No execution run.';
      const res = await aiInterviewService.submitInterview(session._id, code, summary);
      setReport(res.report);
      setSession(prev => prev ? { ...prev, status: 'completed' } : null);
      toast.success('Interview Submitted!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!session) return;
    try {
      const optimisticUserMsg: AIInterviewMessage = {
        _id: Math.random().toString(),
        sessionId: session._id,
        roomId: room.roomId,
        userId: 'candidate',
        role: 'candidate',
        type: 'message',
        content,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticUserMsg]);

      const res = await aiInterviewService.sendMessage(session._id, { content });
      setMessages(prev => [...prev.filter(m => m._id !== optimisticUserMsg._id), res.userMessage, res.aiMessage]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message.');
    }
  };

  const handleRequestHint = async () => {
    if (!session) return;
    toast.info('Requesting hint from AI...');
    try {
      const hintMsg = await aiInterviewService.requestHint(session._id, code);
      setMessages(prev => [...prev, hintMsg]);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to request hint');
    }
  };

  const handleReviewCode = async () => {
    if (!session) return;
    toast.info('Requesting code review...');
    try {
      const reviewMsg = await aiInterviewService.reviewCode(session._id, code, output);
      setMessages(prev => [...prev, reviewMsg]);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to request review');
    }
  };

  if (report) {
    return <AIReportPanel report={report} onBack={() => {}} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--dm-bg)', overflow: 'hidden' }}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={30} minSize={20}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ProblemPanel
                problem={problem}
                room={room}
                onUseAsInput={(input) => { setInputValue(input); setShowOutput(false); }}
                canSave={false}
                language={language}
              />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--dm-border)', flexShrink: 0 }}>
              <GenerateTestCasesButton
                problem={problem}
                roomId={room.roomId}
                mode="interview"
                interviewType="ai"
                isInterviewer={false}
                canSave={false}
                language={language}
                onUseAsInput={(input) => { setInputValue(input); setShowOutput(false); }}
                compact
              />
            </div>
          </div>
        </Panel>
        
        <PanelResizeHandle style={{ width: '8px', cursor: 'col-resize', background: 'var(--dm-border)', transition: 'background 0.2s' }} />
        
        <Panel defaultSize={45} minSize={30}>
          <AIInterviewEditor
            code={code}
            onChangeCode={setCode}
            language={language}
            onLanguageChange={handleLanguageChange}
            inputValue={inputValue}
            setInputValue={setInputValue}
            output={output}
            showOutput={showOutput}
            setShowOutput={setShowOutput}
            isExecuting={isExecuting}
            isSubmitting={isSubmitting}
            onRun={handleRun}
            onSubmit={handleSubmit}
            onRequestHint={handleRequestHint}
            onRequestReview={handleReviewCode}
          />
        </Panel>
        
        <PanelResizeHandle style={{ width: '8px', cursor: 'col-resize', background: 'var(--dm-border)', transition: 'background 0.2s' }} />
        
        <Panel defaultSize={25} minSize={20}>
          <AIChatPanel messages={messages} onSendMessage={handleSendMessage} disabled={isSubmitting || session?.status === 'completed'} />
        </Panel>
      </PanelGroup>
    </div>
  );
}
