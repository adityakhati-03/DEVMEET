import { useEffect, useState } from 'react';
import { problemService } from '../../services/problemService';
import type { IProblem } from '@devmeet/shared';
import { BookOpen, Search } from 'lucide-react';

interface ProblemSelectorProps {
  onSelect: (problemId: string) => void;
}

export default function ProblemSelector({ onSelect }: ProblemSelectorProps) {
  const [problems, setProblems] = useState<IProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const data = await problemService.getProblems();
        setProblems(data);
      } catch (error) {
        console.error('Failed to load problems', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const filtered = problems.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  const getDifficultyColor = (diff: string) => {
    if (diff === 'easy') return '#34d399';
    if (diff === 'medium') return '#fbbf24';
    return '#f87171';
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: 'white' }}>Select a Problem</h2>
        <p style={{ color: '#a8a29e', margin: 0 }}>Choose a coding challenge to start practicing.</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '14px', width: '20px', height: '20px', color: '#78716c' }} />
        <input 
          type="text" 
          placeholder="Search problems..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '14px 14px 14px 48px', background: '#080a0f', border: '1px solid var(--dm-border)', borderRadius: '12px', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><p style={{ color: '#78716c' }}>Loading problems...</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(problem => (
            <div 
              key={problem._id}
              onClick={() => onSelect(problem._id)}
              style={{
                background: 'var(--dm-surface)',
                border: '1px solid var(--dm-border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#34d399'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--dm-border)'}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen style={{ width: '16px', height: '16px', color: '#78716c' }} />
                  {problem.title}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', color: getDifficultyColor(problem.difficulty), background: `${getDifficultyColor(problem.difficulty)}20` }}>
                    {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                  </span>
                  {problem.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '11px', color: '#a8a29e', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Solve
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#78716c' }}>
              No problems found matching "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
