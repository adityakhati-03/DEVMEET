import { useState } from 'react';
import { X, ArrowLeft, Save, Play, Loader2, CheckCircle } from 'lucide-react';
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
      const serverMsg = err?.response?.data?.error?.message || err?.message || 'Failed to generate problem';
      toast.error(serverMsg);
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
      if (roomId) {
        // Always navigate to the room — handles both "already in room" and "on dashboard" cases
        window.location.href = `/rooms/${roomId}`;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save problem');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: '#000', border: '4px solid #fff', borderRadius: '0px', width: '100%', maxWidth: step === 'preview' ? '800px' : '600px', display: 'flex', flexDirection: 'column', boxShadow: '8px 8px 0px 0px #fbbf24', transition: 'max-width 0.3s ease' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '4px solid #fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {step === 'input' && (
              <button onClick={() => setStep('method')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              [AI] Problem Builder
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
                  <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}>Topic or Concept</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Dynamic Programming, Sliding Window, Graphs..."
                    style={{ width: '100%', padding: '12px', background: '#000', border: '4px solid #fff', borderRadius: '0px', color: 'white', boxSizing: 'border-box', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
              )}

              {method === 'prompt' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}>Problem Description / Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the problem you want to create..."
                    rows={4}
                    style={{ width: '100%', padding: '12px', background: '#000', border: '4px solid #fff', borderRadius: '0px', color: 'white', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
              )}

              {method === 'pasted_statement' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}>Paste Raw Problem Statement</label>
                  <textarea
                    value={pastedStatement}
                    onChange={(e) => setPastedStatement(e.target.value)}
                    placeholder="Paste the full text of a coding problem here..."
                    rows={6}
                    style={{ width: '100%', padding: '12px', background: '#000', border: '4px solid #fff', borderRadius: '0px', color: 'white', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
              )}

              {method === 'leetcode_style' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}>Problem Number</label>
                      <input
                        type="text"
                        value={leetcodeNumber}
                        onChange={(e) => setLeetcodeNumber(e.target.value)}
                        placeholder="e.g. 1"
                        style={{ width: '100%', padding: '12px', background: '#000', border: '4px solid #fff', borderRadius: '0px', color: 'white', boxSizing: 'border-box', fontFamily: 'monospace', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}>Problem Title</label>
                      <input
                        type="text"
                        value={leetcodeTitle}
                        onChange={(e) => setLeetcodeTitle(e.target.value)}
                        placeholder="e.g. Two Sum"
                        style={{ width: '100%', padding: '12px', background: '#000', border: '4px solid #fff', borderRadius: '0px', color: 'white', boxSizing: 'border-box', fontFamily: 'monospace', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}>Problem URL</label>
                    <input
                      type="text"
                      value={leetcodeUrl}
                      onChange={(e) => setLeetcodeUrl(e.target.value)}
                      placeholder="e.g. https://leetcode.com/problems/two-sum"
                      style={{ width: '100%', padding: '12px', background: '#000', border: '4px solid #fff', borderRadius: '0px', color: 'white', boxSizing: 'border-box', fontFamily: 'monospace', outline: 'none' }}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Provide any combination of the above. AI will automatically infer the difficulty and tags.</p>
                </div>
              )}

              {(method === 'topic' || method === 'prompt') && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}>Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as ProblemDifficulty)}
                      style={{ width: '100%', padding: '12px', background: '#000', border: '4px solid #fff', borderRadius: '0px', color: 'white', boxSizing: 'border-box', fontFamily: 'monospace', outline: 'none', appearance: 'none' }}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, fontFamily: 'monospace', textTransform: 'uppercase' }}>Tags (Optional, comma separated)</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="e.g. Arrays, Sorting"
                      style={{ width: '100%', padding: '12px', background: '#000', border: '4px solid #fff', borderRadius: '0px', color: 'white', boxSizing: 'border-box', fontFamily: 'monospace', outline: 'none' }}
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
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#60a5fa', fontWeight: 800, fontFamily: 'monospace' }}>AI</span>
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
          <div style={{ padding: '16px 24px', borderTop: '4px solid #fff', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button
              onClick={() => setStep('method')}
              style={{ padding: '10px 24px', background: '#000', color: 'white', border: '4px solid #fff', borderRadius: '0px', fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace', textTransform: 'uppercase', boxShadow: '4px 4px 0px 0px #fff' }}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#fbbf24', color: '#000', border: '4px solid #fff', borderRadius: '0px', fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace', textTransform: 'uppercase', boxShadow: '4px 4px 0px 0px #fff' }}
            >
              Generate Problem
            </button>
          </div>
        )}

        {step === 'preview' && (
          <div style={{ padding: '16px 24px', borderTop: '4px solid #fff', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button
              onClick={() => setStep('input')}
              style={{ padding: '10px 24px', background: '#000', color: 'white', border: '4px solid #fff', borderRadius: '0px', fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace', textTransform: 'uppercase', boxShadow: '4px 4px 0px 0px #fff' }}
              disabled={isSaving}
            >
              Back to Editor
            </button>
            <button
              onClick={handleSaveAndAttach}
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#10b981', color: '#000', border: '4px solid #fff', borderRadius: '0px', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: 'monospace', textTransform: 'uppercase', boxShadow: '4px 4px 0px 0px #fff' }}
            >
              {isSaving ? 'Saving...' : roomId ? 'Save & Use in Room' : 'Save Problem'}
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
