import Editor from '@monaco-editor/react';
import { SUPPORTED_LANGUAGES } from '@devmeet/shared';
import { Play, Send, Lightbulb, Code2 } from 'lucide-react';

interface AIInterviewEditorProps {
  code: string;
  onChangeCode: (v: string) => void;
  language: string;
  onLanguageChange: (l: string) => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  output: string;
  showOutput: boolean;
  setShowOutput: (v: boolean) => void;
  isExecuting: boolean;
  isSubmitting: boolean;
  onRun: () => void;
  onSubmit: () => void;
  onRequestHint: () => void;
  onRequestReview: () => void;
}

export default function AIInterviewEditor({
  code, onChangeCode, language, onLanguageChange,
  inputValue, setInputValue, output, showOutput, setShowOutput,
  isExecuting, isSubmitting, onRun, onSubmit, onRequestHint, onRequestReview
}: AIInterviewEditorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '10px 15px', background: '#18181b', borderBottom: '1px solid var(--dm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>Exit Room</button>
          <select 
            value={language} 
            onChange={(e) => onLanguageChange(e.target.value)}
            className="dm-btn-ghost"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '13px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: 'white' }}
          >
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.id} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onRequestHint} className="dm-btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', color: '#eab308' }} title="Ask AI for a Hint">
            <Lightbulb size={14} /> Hint
          </button>
          <button onClick={onRequestReview} className="dm-btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', color: '#60a5fa' }} title="Ask AI to Review Code">
            <Code2 size={14} /> Review
          </button>
          <button onClick={onRun} disabled={isExecuting} className="dm-btn-secondary" style={{ padding: '4px 12px', fontSize: '12px', background: '#3f3f46', border: 'none', borderRadius: '6px', color: 'white' }}>
            <Play size={14} /> {isExecuting ? 'Running...' : 'Run'}
          </button>
          <button onClick={onSubmit} disabled={isSubmitting} className="dm-btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
            <Send size={14} /> {isSubmitting ? 'Evaluating...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Editor
          height="100%"
          language={language.toLowerCase()}
          theme="vs-dark"
          value={code}
          onChange={(val) => onChangeCode(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {/* Input/Output Console */}
      <div style={{ height: showOutput ? '35%' : '40px', background: '#18181b', borderTop: '1px solid var(--dm-border)', display: 'flex', flexDirection: 'column', transition: 'height 0.2s' }}>
        <div 
          onClick={() => setShowOutput(!showOutput)}
          style={{ padding: '8px 15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '13px', fontWeight: 600, borderBottom: showOutput ? '1px solid var(--dm-border)' : 'none' }}
        >
          <span>Console</span>
          <span>{showOutput ? '▼' : '▲'}</span>
        </div>
        
        {showOutput && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, padding: '15px', borderRight: '1px solid var(--dm-border)', display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '8px' }}>Custom Input</label>
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                style={{ flex: 1, resize: 'none', fontFamily: 'monospace', padding: '8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: 'white' }}
                placeholder="Enter inputs here..."
              />
            </div>
            <div style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column', background: '#09090b' }}>
              <label style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '8px' }}>Execution Output</label>
              <div style={{ flex: 1, overflowY: 'auto', color: '#d4d4d8', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                {output || 'Run your code to see output here.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
