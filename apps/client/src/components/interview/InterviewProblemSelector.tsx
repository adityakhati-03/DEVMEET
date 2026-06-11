import { useState, useEffect } from 'react';
import type { IProblem } from '@devmeet/shared';
import { problemService } from '../../services/problemService';
import { XCircle, Loader2 } from 'lucide-react';

interface InterviewProblemSelectorProps {
  onSelect: (problemId: string) => void;
  onClose: () => void;
}

export default function InterviewProblemSelector({ onSelect, onClose }: InterviewProblemSelectorProps) {
  const [problems, setProblems] = useState<IProblem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    problemService.getProblems()
      .then(setProblems)
      .finally(() => setLoading(false));
  }, []);

  const getDifficultyColor = (diff: string) => {
    if (diff === 'easy') return '#34d399';
    if (diff === 'medium') return '#fbbf24';
    return '#f87171';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '600px', maxHeight: '80vh', background: '#080a0f', borderRadius: '16px', border: '1px solid var(--dm-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--dm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 700 }}>Select a Problem</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <XCircle size={20} />
          </button>
        </div>
        
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin text-emerald-400" /></div>
          ) : problems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>No problems available.</div>
          ) : (
            problems.map(p => (
              <div 
                key={p._id} 
                onClick={() => onSelect(p._id as string)}
                style={{ padding: '16px', background: 'var(--dm-surface)', borderRadius: '12px', border: '1px solid var(--dm-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#34d399'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--dm-border)'}
              >
                <div>
                  <h3 style={{ margin: '0 0 6px', color: 'white', fontSize: '15px', fontWeight: 600 }}>{p.title}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {p.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: '11px', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', color: getDifficultyColor(p.difficulty), background: `${getDifficultyColor(p.difficulty)}20` }}>
                  {p.difficulty.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
