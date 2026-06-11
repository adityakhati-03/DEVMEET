import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEffect, useState, useRef } from 'react';
import { useCollaborationContext } from '../../collaboration/CollaborationProvider';
import { useSharedState, useSelfInfo } from '../../collaboration/useCollaboration';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Play, ChevronDown, ChevronUp, Loader2, Terminal, CheckCircle } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@devmeet/shared';
import Toolbar from '../roomstructure/Toolbar';
import styles from '../editor/CollaborativeEditor.module.css';

interface CurrentUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

interface InterviewEditorProps {
  roomId: string;
  currentUser: CurrentUser;
  isExecuting: boolean;
  isSubmitting: boolean;
  onRun: (code: string, languageId: number, stdin: string) => void;
  onSubmit: (code: string, languageId: number) => void;
  output: string;
  externalInput?: string | null;
  onExternalInputConsumed?: () => void;
}

export default function InterviewEditor({ roomId, currentUser, isExecuting, isSubmitting, onRun, onSubmit, output: parentOutput, externalInput, onExternalInputConsumed }: InterviewEditorProps) {
  const { doc, provider, status } = useCollaborationContext();
  const [showOutput, setShowOutput] = useState(false);
  const { setSelfInfo } = useSelfInfo();

  const [language, setLanguage] = useSharedState<string>('language', 'JavaScript');
  const [inputValue, setInputValue] = useSharedState<string>('input', '');

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

  // Inject external input (from Generate Test Cases button)
  useEffect(() => {
    if (externalInput != null) {
      setInputValue(externalInput);
      setShowOutput(false);
      onExternalInputConsumed?.();
    }
  }, [externalInput]);

  useEffect(() => {
    if (isExecuting || isSubmitting) setShowOutput(true);
  }, [isExecuting, isSubmitting]);

  const handleExecute = () => {
    if (!doc) return;
    const rawCode = doc.getText('codemirror').toString();
    const langId = getLanguageId(language);
    if (!langId) return;
    onRun(rawCode, langId, inputValue);
  };

  const handleSubmit = () => {
    if (!doc) return;
    const rawCode = doc.getText('codemirror').toString();
    const langId = getLanguageId(language);
    if (!langId) return;
    onSubmit(rawCode, langId);
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
      <div className={styles.editorHeader}>
        <div style={{ flex: 1 }}>
          <Toolbar language={language} onLanguageChange={setLanguage} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExecute}
            disabled={isExecuting || isSubmitting}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 18px', borderRadius: '7px',
              background: isExecuting ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
              color: isExecuting ? '#fff' : '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 600, fontSize: '13px',
              cursor: (isExecuting || isSubmitting) ? 'not-allowed' : 'pointer',
              transition: 'all 150ms', flexShrink: 0,
            }}
          >
            {isExecuting ? <Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" /> : <Play style={{ width: '13px', height: '13px' }} />}
            Run
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isExecuting || isSubmitting}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 18px', borderRadius: '7px',
              background: isSubmitting ? 'rgba(52,211,153,0.12)' : '#34d399',
              color: isSubmitting ? '#34d399' : '#080a0f',
              border: isSubmitting ? '1px solid rgba(52,211,153,0.25)' : 'none',
              fontWeight: 700, fontSize: '13px',
              cursor: (isExecuting || isSubmitting) ? 'not-allowed' : 'pointer',
              transition: 'all 150ms', flexShrink: 0,
            }}
          >
            {isSubmitting ? <Loader2 style={{ width: '13px', height: '13px' }} className="animate-spin" /> : <CheckCircle style={{ width: '13px', height: '13px' }} />}
            Submit
          </button>
        </div>
      </div>

      <div className={styles.leftPane}>
        <div className={styles.splitContainer}>
          <PanelGroup direction="vertical" className={styles.panelGroup}>
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

            <PanelResizeHandle className={styles.resizableHandle} />

            <Panel defaultSize={22} minSize={12}>
              <div className={styles.outputPanel}>
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

                {showOutput ? (
                  <pre className={styles.outputBody}>
                    {parentOutput || <span style={{ color: '#4a5568', fontStyle: 'italic' }}>(Output will appear here after you run the code)</span>}
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
