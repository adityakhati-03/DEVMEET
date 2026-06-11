import { useState, useRef, useEffect } from 'react';
import type { AIInterviewMessage } from '@devmeet/shared';
import AIMessageBubble from './AIMessageBubble';
import { Send } from 'lucide-react';

interface AIChatPanelProps {
  messages: AIInterviewMessage[];
  onSendMessage: (msg: string) => void;
  disabled?: boolean;
}

export default function AIChatPanel({ messages, onSendMessage, disabled }: AIChatPanelProps) {
  const [val, setVal] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!val.trim() || disabled) return;
    onSendMessage(val);
    setVal('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#09090b', borderLeft: '1px solid var(--dm-border)' }}>
      {/* Header */}
      <div style={{ padding: '15px', borderBottom: '1px solid var(--dm-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
        <h3 style={{ margin: 0, fontSize: '14px', color: 'white', fontWeight: 600 }}>AI Interviewer</h3>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <AIMessageBubble key={msg._id || i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '15px', borderTop: '1px solid var(--dm-border)', background: '#18181b' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={disabled}
            style={{ padding: '8px 12px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: 'white', flex: 1 }}
          />
          <button 
            onClick={handleSend}
            disabled={disabled || !val.trim()}
            style={{ 
              background: disabled || !val.trim() ? '#3f3f46' : 'var(--dm-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0 12px',
              cursor: disabled || !val.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
