import { useState } from 'react';
import { X, ArrowLeft, Save, Play, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { aiProblemService } from '../../services/aiProblemService';
import type { AIProblemGenerationMethod, AIProblemBuilderResponse, ProblemDifficulty } from '@devmeet/shared';
import AIProblemMethodSelector from './AIProblemMethodSelector';
import AIProblemPreview from './AIProblemPreview';
import { toast } from 'sonner';

interface AIProblemBuilderModalProps {
  roomId?: string;
  mode?: 'collaboration' | 'practice' | 'interview';
  interviewType?: 'normal' | 'ai' | null;
  onClose: () => void;
}

export default function AIProblemBuilderModal({ roomId, mode, interviewType, onClose }: AIProblemBuilderModalProps) {
  const [step, setStep] = useState<'method' | 'input' | 'generating' | 'preview'>('method');
  const [method, setMethod] = useState<AIProblemGenerationMethod | null>(null);
  
  // Form State
  const [topic, setTopic] = useState('');
  const [prompt, setPrompt] = useState('');
  const [pastedStatement, setPastedStatement] = useState('');
  const [leetcodeNumber, setLeetcodeNumber] = useState('');
  const [leetcodeTitle, setLeetcodeTitle] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [difficulty, setDifficulty] = useState<ProblemDifficulty>('medium');
  const [tags, setTags] = useState('');

  const [generatedProblem, setGeneratedProblem] = useState<AIProblemBuilderResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectMethod = (selected: AIProblemGenerationMethod) => {
    setMethod(selected);
    setStep('input');
  };

  const handleGenerate = async () => {
    if (!method) return;
    
    // Validate required inputs
    if (method === 'topic' && !topic.trim()) return toast.error('Topic is required');
    if (method === 'prompt' && !prompt.trim()) return toast.error('Prompt is required');
    if (method === 'pasted_statement' && !pastedStatement.trim()) return toast.error('Problem statement is required');
    if (method === 'leetcode_style' && !leetcodeNumber.trim() && !leetcodeTitle.trim() && !leetcodeUrl.trim()) {
      return toast.error('Please provide at least one problem reference (Number, Title, or URL)');
    }

    setStep('generating');

    try {
      const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      const combinedLeetCodeQuery = [
        leetcodeNumber.trim() ? `Problem Number: ${leetcodeNumber.trim()}` : '',
        leetcodeTitle.trim() ? `Title: ${leetcodeTitle.trim()}` : '',
        leetcodeUrl.trim() ? `URL: ${leetcodeUrl.trim()}` : ''
      ].filter(Boolean).join(', ');
      
      const res = await aiProblemService.generate({
        method,
        topic: method === 'topic' ? topic : undefined,
        prompt: method === 'prompt' ? prompt : undefined,
        pastedStatement: method === 'pasted_statement' ? pastedStatement : undefined,
        leetcodeQuery: method === 'leetcode_style' ? combinedLeetCodeQuery : undefined,
        difficulty: method === 'leetcode_style' ? undefined : difficulty,
        tags: method === 'leetcode_style' ? undefined : (parsedTags.length > 0 ? parsedTags : undefined),
        roomId,
        mode,
        interviewType
      });

      setGeneratedProblem(res);
      setStep('preview');
      toast.success('Problem built successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate problem');
      setStep('input');
    }
  };

  const handleSaveAndAttach = async () => {
    if (!generatedProblem) return;
    setIsSaving(true);
    try {
      // If roomId is present, save and attach
      if (roomId) {
        // We already have the generationId, so just save it then attach it
        const { problemId } = await aiProblemService.save({ generationId: generatedProblem.generationId, isPublic: false });
        await aiProblemService.attachToRoom({ problemId, roomId });
        toast.success('Problem saved and attached to room!');
      } else {
        // Just save to bank
        await aiProblemService.save({ generationId: generatedProblem.generationId, isPublic: false });
        toast.success('Problem saved to your bank!');
      }
      onClose();
      // Reload page to reflect new problem context if attached
      if (roomId) {
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save problem');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: '#0d0f14', border: '1px solid var(--dm-border)', borderRadius: '16px', width: '100%', maxWidth: step === 'preview' ? '800px' : '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', transition: 'max-width 0.3s ease' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--dm-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {step === 'input' && (
              <button onClick={() => setStep('method')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#60a5fa" />
              AI Problem Builder
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          
          {step === 'method' && (
            <AIProblemMethodSelector onSelect={handleSelectMethod} />
          )}

          {step === 'input' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {method === 'topic' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Topic or Concept</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Dynamic Programming, Sliding Window, Graphs..."
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dm-border)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {method === 'prompt' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Problem Description / Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the problem you want to create..."
                    rows={4}
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dm-border)', borderRadius: '8px', color: 'white', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {method === 'pasted_statement' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Paste Raw Problem Statement</label>
                  <textarea
                    value={pastedStatement}
                    onChange={(e) => setPastedStatement(e.target.value)}
                    placeholder="Paste the full text of a coding problem here..."
                    rows={6}
                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dm-border)', borderRadius: '8px', color: 'white', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {method === 'leetcode_style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Problem Number</label>
                      <input
                        type="text"
                        value={leetcodeNumber}
                        onChange={(e) => setLeetcodeNumber(e.target.value)}
                        placeholder="e.g. 1"
                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dm-border)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Problem Title</label>
                      <input
                        type="text"
                        value={leetcodeTitle}
                        onChange={(e) => setLeetcodeTitle(e.target.value)}
                        placeholder="e.g. Two Sum"
                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dm-border)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Problem URL</label>
                    <input
                      type="text"
                      value={leetcodeUrl}
                      onChange={(e) => setLeetcodeUrl(e.target.value)}
                      placeholder="e.g. https://leetcode.com/problems/two-sum"
                      style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dm-border)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Provide any combination of the above. AI will automatically infer the difficulty and tags.</p>
                </div>
              )}

              {(method === 'topic' || method === 'prompt') && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as ProblemDifficulty)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dm-border)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Tags (Optional, comma separated)</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="e.g. Arrays, Sorting"
                      style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--dm-border)', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'generating' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
              <div style={{ position: 'relative', width: '64px', height: '64px', marginBottom: '24px' }}>
                <div style={{ position: 'absolute', inset: 0, border: '4px solid rgba(99, 102, 241, 0.2)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', inset: 0, border: '4px solid #60a5fa', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
                <Sparkles style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#60a5fa' }} size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: '0 0 8px 0' }}>Building your problem...</h3>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px', textAlign: 'center' }}>
                AI is generating the description, starter code, and test cases.<br/>This usually takes 10-15 seconds.
              </p>
            </div>
          )}

          {step === 'preview' && generatedProblem && (
            <AIProblemPreview data={generatedProblem.problem} />
          )}

        </div>

        {/* Footer Actions */}
        {step === 'input' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--dm-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={() => setStep('method')}
              style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--dm-border)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
            >
              <Sparkles size={16} /> Generate Problem
            </button>
          </div>
        )}

        {step === 'preview' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--dm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setStep('input')}
              disabled={isSaving}
              style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--dm-border)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Back to Edit
            </button>
            <button
              onClick={handleSaveAndAttach}
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#34d399', color: '#080a0f', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : roomId ? <Play size={18} /> : <Save size={18} />}
              {roomId ? (isSaving ? 'Attaching...' : 'Save & Use in Room') : (isSaving ? 'Saving...' : 'Save to Problem Bank')}
            </button>
          </div>
        )}

      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
