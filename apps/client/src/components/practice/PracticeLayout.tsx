import { useEffect, useState, useRef } from 'react';
import type { IRoom, IProblem, IPracticeAttempt } from '@devmeet/shared';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import ProblemPanel from './ProblemPanel';
import PracticeEditor from './PracticeEditor';
import AttemptHistory from './AttemptHistory';
import { practiceService } from '../../services/practiceService';
import { SUPPORTED_LANGUAGES } from '@devmeet/shared';
import { toast } from 'sonner';

interface PracticeLayoutProps {
  room: IRoom;
  problem: IProblem;
  currentUser?: { id: string };
}

export default function PracticeLayout({ room, problem, currentUser }: PracticeLayoutProps) {
  const [attempts, setAttempts] = useState<IPracticeAttempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>();
  const [code, setCode] = useState(problem.starterCode?.javascript || '');
  const [language, setLanguage] = useState('JavaScript');
  const [inputValue, setInputValue] = useState('');
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load initial attempts
    const fetchAttempts = async () => {
      try {
        const data = await practiceService.getAttempts(room.roomId);
        setAttempts(data);
      } catch (err) {
        console.error('Failed to load attempts', err);
      }
    };
    fetchAttempts();
  }, [room.roomId]);

  useEffect(() => {
    // Polling logic for active attempt
    if (!activeAttemptId) return;

    const poll = async () => {
      try {
        const attempt = await practiceService.getAttempt(activeAttemptId);
        
        // Update attempt in list
        setAttempts(prev => prev.map(a => a._id === attempt._id ? attempt : a));
        
        if (['queued', 'running'].includes(attempt.status)) {
          // Continue polling
          pollingRef.current = setTimeout(poll, 1500);
        } else {
          // Finished
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
        console.error('Polling error', err);
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
    if (!langObj) {
      toast.error('Invalid language selected');
      return;
    }

    setIsExecuting(true);
    setShowOutput(true);
    setOutput('⏳ Queued...');

    try {
      const res = await practiceService.runPracticeCode(room.roomId, {
        code,
        languageId: langObj.id,
        stdin: inputValue
      });
      
      setActiveAttemptId(res.attemptId);
      
      // Optimistically add to attempts list
      const tempAttempt: any = {
        _id: res.attemptId,
        status: res.status,
        language,
        code,
        createdAt: new Date().toISOString()
      };
      setAttempts(prev => [tempAttempt, ...prev]);
      
    } catch (err: any) {
      setIsExecuting(false);
      setOutput(`Error: ${err.message || 'Failed to queue execution'}`);
      toast.error('Failed to run code');
    }
  };

  const handleSelectAttempt = (attempt: IPracticeAttempt) => {
    setSelectedAttemptId(attempt._id);
    setCode(attempt.code);
    setLanguage(attempt.language);
    
    let out = attempt.stdout || '';
    if (attempt.stderr) out += `\n\n[stderr]\n${attempt.stderr}`;
    if (!out.trim()) out = '(No output)';
    if (attempt.executionTimeMs) out += `\n\n⏱ ${attempt.executionTimeMs}ms`;
    
    setOutput(out);
    setShowOutput(true);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--dm-bg)', overflow: 'hidden' }}>
      <PanelGroup direction="horizontal">
        <Panel defaultSize={35} minSize={20}>
          <ProblemPanel
            problem={problem}
            room={room}
            onUseAsInput={(input) => { setInputValue(input); setShowOutput(false); }}
            canSave={currentUser?.id === (typeof room.createdBy === 'string' ? room.createdBy : (room.createdBy as any)?._id)}
            language={language}
          />
        </Panel>
        
        <PanelResizeHandle style={{ width: '8px', cursor: 'col-resize', background: 'var(--dm-border)', transition: 'background 0.2s' }} />
        
        <Panel defaultSize={45} minSize={30}>
          <PracticeEditor
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
            onRun={handleRun}
          />
        </Panel>
        
        <PanelResizeHandle style={{ width: '8px', cursor: 'col-resize', background: 'var(--dm-border)', transition: 'background 0.2s' }} />
        
        <Panel defaultSize={20} minSize={15}>
          <AttemptHistory 
            attempts={attempts} 
            onSelect={handleSelectAttempt}
            selectedId={selectedAttemptId}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
