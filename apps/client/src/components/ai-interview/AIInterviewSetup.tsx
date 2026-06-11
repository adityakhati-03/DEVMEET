import { useState } from 'react';
import type { IRoom } from '@devmeet/shared';
import { aiInterviewService } from '../../services/aiInterviewService';
import { toast } from 'sonner';
import AIProblemBuilderButton from '../ai-problem-builder/AIProblemBuilderButton';

interface AIInterviewSetupProps {
  room: IRoom;
  onSetupComplete: () => void;
}

export default function AIInterviewSetup({ room, onSetupComplete }: AIInterviewSetupProps) {
  const [topic, setTopic] = useState('Data Structures and Algorithms');
  const [difficulty, setDifficulty] = useState('Medium');
  const [style, setStyle] = useState('Standard Technical Interview');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    const loadingToast = toast.loading('AI is crafting your interview problem...');
    try {
      await aiInterviewService.setupSession({
        roomId: room.roomId,
        topic,
        difficulty,
        style,
        durationMinutes: 45
      });
      toast.success('Interview problem ready!', { id: loadingToast });
      onSetupComplete();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || 'Failed to setup interview.', { id: loadingToast });
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    color: 'white',
    fontSize: '15px',
    marginBottom: '20px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#a1a1aa',
    marginBottom: '8px'
  };

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--dm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#09090b', padding: '40px', borderRadius: '16px', border: '1px solid #27272a', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px', textAlign: 'center' }}>Setup AI Interview</h2>
        <p style={{ color: '#a1a1aa', textAlign: 'center', marginBottom: '30px' }}>Customize your mock interview experience.</p>

        <div>
          <label style={labelStyle}>Topic or Focus Area</label>
          <input 
            style={inputStyle}
            placeholder="e.g. Dynamic Programming, System Design, React"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />

          <label style={labelStyle}>Difficulty Level</label>
          <select style={inputStyle} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <label style={labelStyle}>Interview Style / Company Target</label>
          <input 
            style={inputStyle}
            placeholder="e.g. Google, strict evaluation, generic"
            value={style}
            onChange={e => setStyle(e.target.value)}
          />

          <button 
            onClick={handleStart}
            disabled={loading || !topic.trim()}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#059669' : 'var(--dm-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '10px'
            }}
          >
            {loading ? 'Generating...' : 'Start Interview'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#27272a' }}></div>
            <span style={{ color: '#52525b', fontSize: '12px', fontWeight: 600, padding: '0 16px' }}>OR USE GLOBAL BUILDER</span>
            <div style={{ flex: 1, height: '1px', background: '#27272a' }}></div>
          </div>

          <AIProblemBuilderButton
            roomId={room.roomId}
            mode={room.mode}
            interviewType={room.interviewType}
          />
        </div>
      </div>
    </div>
  );
}
