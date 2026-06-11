import { BookOpen, FileText, Code2, Sparkles } from 'lucide-react';
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
      icon: <Sparkles size={24} color="#60a5fa" />,
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
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>How do you want to build this problem?</h2>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>Choose a generation method below.</p>
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
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${m.borderColor}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = m.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
              {m.icon}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 8px 0' }}>{m.title}</h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{m.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
