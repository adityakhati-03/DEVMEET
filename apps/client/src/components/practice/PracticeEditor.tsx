import React, { useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Play, ChevronDown, ChevronUp, Loader2, Terminal } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@devmeet/shared';
import Toolbar from '../roomstructure/Toolbar';
import styles from '../editor/CollaborativeEditor.module.css';

interface PracticeEditorProps {
  code: string;
  onChangeCode: (val: string) => void;
  language: string;
  onLanguageChange: (val: string) => void;
  inputValue: string;
  setInputValue: (val: string) => void;
  output: string;
  showOutput: boolean;
  setShowOutput: React.Dispatch<React.SetStateAction<boolean>>;
  isExecuting: boolean;
  onRun: () => void;
}

export default function PracticeEditor({
  code,
  onChangeCode,
  language,
  onLanguageChange,
  inputValue,
  setInputValue,
  output,
  showOutput,
  setShowOutput,
  isExecuting,
  onRun
}: PracticeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();

  const getMonacoLanguage = (lang: string) => {
    const l = lang.toLowerCase();
    if (l.includes('python')) return 'python';
    if (l.includes('java') && !l.includes('javascript')) return 'java';
    if (l.includes('c++')) return 'cpp';
    return 'javascript';
  };

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
  };

  return (
    <div className={styles.container}>
      <div className={styles.editorHeader}>
        <div style={{ flex: 1 }}>
          <Toolbar language={language} onLanguageChange={onLanguageChange} />
        </div>
        <button
          onClick={onRun}
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

      <div className={styles.leftPane}>
        <div className={styles.splitContainer}>
          <PanelGroup direction="vertical" className={styles.panelGroup}>
            <Panel defaultSize={70} minSize={40}>
              <div className={styles.codePanel}>
                <div className={styles.editorContainer}>
                  <Editor
                    height="100%"
                    language={getMonacoLanguage(language)}
                    theme="devmeet-dark"
                    value={code}
                    onChange={(val) => onChangeCode(val || '')}
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

            <Panel defaultSize={30} minSize={12}>
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
