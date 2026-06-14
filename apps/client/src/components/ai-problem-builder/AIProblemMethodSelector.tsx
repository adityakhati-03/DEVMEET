import { BookOpen, FileText, Code2 } from 'lucide-react';
import type { AIProblemGenerationMethod } from '@devmeet/shared';

interface AIProblemMethodSelectorProps {
  onSelect: (method: AIProblemGenerationMethod) => void;
}

export default function AIProblemMethodSelector({ onSelect }: AIProblemMethodSelectorProps) {
  const methods = [
    {
      id: 'topic' as AIProblemGenerationMethod,
      title: 'Generate from Topic',
      description: 'Enter a topic like "Dynamic Programming" or "Two Pointers" and we\'ll build a unique problem.',
      icon: <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '18px', color: '#60a5fa' }}>[AI]</span>,
      color: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    {
      id: 'prompt' as AIProblemGenerationMethod,
      title: 'Natural Language Prompt',
      description: 'Describe exactly what kind of problem you want in plain English.',
      icon: <FileText size={24} color="#a78bfa" />,
      color: 'rgba(167, 139, 250, 0.1)',
      borderColor: 'rgba(167, 139, 250, 0.3)',
    },
    {
      id: 'pasted_statement' as AIProblemGenerationMethod,
      title: 'Parse Pasted Statement',
      description: 'Paste a raw problem statement and AI will structure it into a playable DevMeet problem.',
      icon: <Code2 size={24} color="#34d399" />,
      color: 'rgba(52, 211, 153, 0.1)',
      borderColor: 'rgba(52, 211, 153, 0.3)',
    },
    {
      id: 'leetcode_style' as AIProblemGenerationMethod,
      title: 'LeetCode Inspired',
      description: 'Provide a title or URL, and AI will generate an original practice problem inspired by it.',
      icon: <BookOpen size={24} color="#fbbf24" />,
      color: 'rgba(251, 191, 36, 0.1)',
      borderColor: 'rgba(251, 191, 36, 0.3)',
    },
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0', fontFamily: 'monospace', textTransform: 'uppercase' }}>How do you want to build this problem?</h2>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px', fontFamily: 'monospace' }}>Choose a generation method below.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '24px',
              background: '#000',
              border: `4px solid ${m.borderColor}`,
              borderRadius: '0px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              boxShadow: '4px 4px 0px 0px rgba(255, 255, 255, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = m.color;
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = `6px 6px 0px 0px ${m.borderColor}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#000';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(255, 255, 255, 0.2)';
            }}
          >
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '0px', marginBottom: '16px', border: '2px solid rgba(255,255,255,0.1)' }}>
              {m.icon}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0', fontFamily: 'monospace', textTransform: 'uppercase' }}>{m.title}</h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{m.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
