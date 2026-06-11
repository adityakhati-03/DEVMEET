import type { AIInterviewMessage } from '@devmeet/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AIMessageBubble({ message }: { message: AIInterviewMessage }) {
  const isUser = message.role === 'candidate';
  const isHint = message.type === 'hint';
  const isFeedback = message.type === 'feedback';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start' 
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: '8px',
        background: isUser ? 'var(--dm-primary)' : (isHint ? '#854d0e' : (isFeedback ? '#1e3a8a' : '#27272a')),
        color: 'white',
        fontSize: '13px',
        lineHeight: '1.5'
      }}>
        {(!isUser && message.type !== 'message') && (
          <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8, marginBottom: '4px', textTransform: 'uppercase' }}>
            {message.type}
          </div>
        )}
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({node, inline, className, children, ...props}: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline ? (
                <div style={{ background: '#000', padding: '8px', borderRadius: '4px', overflowX: 'auto', marginTop: '8px', marginBottom: '8px' }}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </div>
              ) : (
                <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '3px' }} {...props}>
                  {children}
                </code>
              )
            }
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
