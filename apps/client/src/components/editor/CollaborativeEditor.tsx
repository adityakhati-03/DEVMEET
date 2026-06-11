/**
 * CollaborativeEditor — adapted from src/components/editor/CollaborativeEditor.tsx
 *
 * Key changes:
 * - Removed "use client" directive
 * - Toolbar import path updated to new component location
 * - Code execution now uses executionService instead of raw fetch('/api/execute')
 * - Languages fetched from SUPPORTED_LANGUAGES constant (no network call needed)
 * - Accepts currentUser prop (instead of reading from useSession)
 */

import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEffect, useState, useRef } from 'react';
import { useCollaborationContext } from '../../collaboration/CollaborationProvider';
import { useSharedState, useSelfInfo } from '../../collaboration/useCollaboration';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Play, ChevronDown, ChevronUp, Loader2, Terminal } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@devmeet/shared';
import { executionService, TERMINAL_STATUSES } from '../../services/executionService';
import Toolbar from '../roomstructure/Toolbar';
import styles from './CollaborativeEditor.module.css';
import GenerateTestCasesButton from '../test-cases/GenerateTestCasesButton';
import AIProblemBuilderButton from '../ai-problem-builder/AIProblemBuilderButton';

interface CurrentUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

interface CollaborativeEditorProps {
  roomId: string;
  currentUser: CurrentUser;
  room?: import('@devmeet/shared').IRoom;
}

export default function CollaborativeEditor({ roomId, currentUser, room }: CollaborativeEditorProps) {
  const { doc, provider, status } = useCollaborationContext();
  const [_yUndoManager, setYUndoManager] = useState<Y.UndoManager>();
  const [showOutput, setShowOutput] = useState(false);
  const { setSelfInfo } = useSelfInfo();

  // Replicated state — language defaults to 'JavaScript' (reset on every mount)
  const [language, setLanguage] = useSharedState<string>('language', 'JavaScript');
  const [output, setOutput] = useSharedState<string>('output', '');
  const [inputValue, setInputValue] = useSharedState<string>('input', '');

  // isExecuting is LOCAL only — don't share across users (each user manages their own run)
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Listen for execution results pushed by the server via Yjs metadata
  useEffect(() => {
    if (!doc) return;
    const metadataMap = doc.getMap('metadata');
    
    const observer = (event: Y.YMapEvent<any>) => {
      if (event.keysChanged.has('lastExecution')) {
        const job = metadataMap.get('lastExecution') as any;
        if (!job) return;

        setIsExecuting(false);

        if (job.status === 'completed') {
          let out = job.stdout || '';
          if (job.stderr) out += `\n\n[stderr]\n${job.stderr}`;
          if (!out.trim()) out = '(No output)';
          if (job.executionTimeMs) out += `\n\n⏱ ${job.executionTimeMs}ms`;
          setOutput(out);
        } else if (job.status === 'failed') {
          const errMsg = job.errorMessage || job.stderr || 'Unknown error';
          const isCompile = errMsg.startsWith('Compilation Error:');
          const prefix = isCompile ? '🔴 Compile Error:' : '❌ Runtime Error:';
          const detail = isCompile
            ? errMsg.replace(/^Compilation Error:\n?/, '')
            : errMsg.replace(/^Runtime Error.*?\n?/, '');
          setOutput(`${prefix}\n${detail}`);
        } else if (job.status === 'timeout') {
          setOutput('⏱ Timed out. Check for infinite loops.');
        }
      }
    };
    
    metadataMap.observe(observer);
    return () => metadataMap.unobserve(observer);
  }, [doc, setOutput]);

  const getLanguageId = (name: string): number => {
    const match = SUPPORTED_LANGUAGES.find(
      (l) => l.name.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, '')
    );
    return match?.id ?? 1;
  };

  const getMonacoLanguage = (lang: string) => {
    const l = lang.toLowerCase();
    if (l.includes('python')) return 'python';
    if (l.includes('java') && !l.includes('javascript')) return 'java';
    if (l.includes('c++')) return 'cpp';
    return 'javascript';
  };

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const monaco = useMonaco();

  // Apply custom dark theme
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('devmeet-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0d0f14',
          'editor.lineHighlightBackground': '#ffffff0a',
          'editorLineNumber.foreground': '#3d4555',
          'editorLineNumber.activeForeground': '#34d399',
        },
      });
      monaco.editor.setTheme('devmeet-dark');
    }
  }, [monaco]);

  const handleEditorMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;

    if (!doc || !provider) return;

    const ytext = doc.getText('codemirror');
    const undoManager = new Y.UndoManager(ytext);
    setYUndoManager(undoManager);

    setSelfInfo({ name: currentUser.name, color: '#34d399' });

    bindingRef.current = new MonacoBinding(
      ytext,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      provider.awareness
    );
  };

  useEffect(() => {
    return () => { bindingRef.current?.destroy(); };
  }, []);

  useEffect(() => {
    if (isExecuting) setShowOutput(true);
  }, [isExecuting]);

  const handleExecute = async () => {
    if (!doc) return;
    const rawCode = doc.getText('codemirror').toString();
    if (!rawCode || rawCode.trim() === '') {
      setOutput('Error: Code editor is empty');
      setShowOutput(true);
      return;
    }

    const langId = getLanguageId(language);
    if (!langId) {
      setOutput('Error: Could not resolve language ID. Select a language first.');
      return;
    }

    if (isExecuting) return;

    setIsExecuting(true);
    setOutput('⏳ Queued...');
    setShowOutput(true);

    try {
      await executionService.runCode({
        code: rawCode,
        languageId: langId,
        roomId: roomId,
        stdin: inputValue,
      });

      setOutput('🔄 Running...');
      // Execution result will be pushed via Yjs metadata observer (no polling needed!)
    } catch (e: unknown) {
      setOutput(`Error: ${(e as Error).message || 'Failed to queue execution'}`);
      setIsExecuting(false);
    }
  };

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#f87171' }}>
        Failed to connect to collaboration server.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── Header bar ── */}
      <div className={styles.editorHeader}>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginRight: '16px', flexShrink: 0 }}>Exit Room</button>
        <div style={{ flex: 1 }}>
          <Toolbar language={language} onLanguageChange={setLanguage} />
        </div>
        <GenerateTestCasesButton
          roomId={roomId}
          mode="collaboration"
          language={language}
          onUseAsInput={(input) => { setInputValue(input); setShowOutput(false); }}
          compact
        />
        <AIProblemBuilderButton
          roomId={roomId}
          mode="collaboration"
          compact
        />
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 18px', borderRadius: '7px',
            background: isExecuting ? 'rgba(52,211,153,0.12)' : '#34d399',
            color: isExecuting ? '#34d399' : '#080a0f',
            border: isExecuting ? '1px solid rgba(52,211,153,0.25)' : 'none',
            fontWeight: 700, fontSize: '13px',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            transition: 'all 150ms', flexShrink: 0,
          }}
        >
          {isExecuting
            ? <><Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" /> Running…</>
            : <><Play style={{ width: '13px', height: '13px' }} /> Run</>
          }
        </button>
      </div>

      {/* ── Editor + Terminal split ── */}
      <div className={styles.leftPane}>
        <div className={styles.splitContainer}>
          <PanelGroup direction="vertical" className={styles.panelGroup}>

            {/* Code Editor Panel */}
            <Panel defaultSize={78} minSize={40}>
              <div className={styles.codePanel}>
                <div className={styles.editorContainer}>
                  <Editor
                    height="100%"
                    language={getMonacoLanguage(language)}
                    theme="devmeet-dark"
                    onMount={handleEditorMount}
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontLigatures: true,
                      wordWrap: 'on',
                      padding: { top: 16, bottom: 16 },
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: 'smooth',
                      cursorSmoothCaretAnimation: 'on',
                      lineNumbers: 'on',
                      renderLineHighlight: 'line',
                    }}
                  />
                </div>
              </div>
            </Panel>

            {/* Drag handle */}
            <PanelResizeHandle className={styles.resizableHandle} />

            {/* Output / Input Panel */}
            <Panel defaultSize={22} minSize={12}>
              <div className={styles.outputPanel}>
                {/* Output header */}
                <div className={styles.outputHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal style={{ width: '13px', height: '13px', color: '#34d399' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {showOutput ? 'Output' : 'Input'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowOutput(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '5px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#78716c', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {showOutput
                      ? <><ChevronUp style={{ width: '12px', height: '12px' }} /> Input</>
                      : <><ChevronDown style={{ width: '12px', height: '12px' }} /> Output</>}
                  </button>
                </div>

                {/* Output body */}
                {showOutput ? (
                  <pre className={styles.outputBody}>
                    {output || <span style={{ color: '#4a5568', fontStyle: 'italic' }}>(Output will appear here after you run the code)</span>}
                  </pre>
                ) : (
                  <textarea
                    className={styles.outputBody}
                    style={{ resize: 'none', outline: 'none', background: 'transparent', border: 'none', width: '100%', color: '#e2e8f0' }}
                    placeholder="Enter stdin data here…"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                  />
                )}
              </div>
            </Panel>

          </PanelGroup>
        </div>
      </div>
    </div>
  );
}
