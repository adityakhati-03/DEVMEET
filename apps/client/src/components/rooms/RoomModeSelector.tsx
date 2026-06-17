import { useState } from 'react';
import type { RoomMode, InterviewType } from '@devmeet/shared';
import { Users, User, Bot, Briefcase, X } from 'lucide-react';

interface RoomModeSelectorProps {
  onClose: () => void;
  onCreate: (mode: RoomMode, interviewType: InterviewType, title: string) => void;
}

export default function RoomModeSelector({ onClose, onCreate }: RoomModeSelectorProps) {
  const [mode, setMode] = useState<RoomMode | null>(null);
  const [interviewType, setInterviewType] = useState<InterviewType>(null);
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    if (!mode) return;
    if (mode === 'interview' && !interviewType) return;
    onCreate(mode, interviewType, title);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="bg-[var(--dm-card)] border border-[var(--dm-border)] rounded-2xl p-6 sm:p-8 w-[calc(100%-32px)] max-w-[600px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col gap-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'white' }}>Create New Room</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c' }}>
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#a8a29e', fontWeight: 600 }}>Room Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. DSA Study Group"
            style={{
              background: '#080a0f', border: '1px solid var(--dm-border)', borderRadius: '8px',
              padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '13px', color: '#a8a29e', fontWeight: 600 }}>Select Room Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Collaboration */}
            <div
              onClick={() => { setMode('collaboration'); setInterviewType(null); }}
              style={{
                border: mode === 'collaboration' ? '2px solid #34d399' : '2px solid var(--dm-border)',
                background: mode === 'collaboration' ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 200ms',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <Users style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px', color: 'white' }}>Collaboration</h3>
                <p style={{ fontSize: '12px', color: '#78716c', margin: 0, lineHeight: 1.4 }}>Editor + video conferencing for group coding.</p>
              </div>
            </div>

            {/* Practice */}
            <div
              onClick={() => { setMode('practice'); setInterviewType(null); }}
              style={{
                border: mode === 'practice' ? '2px solid #34d399' : '2px solid var(--dm-border)',
                background: mode === 'practice' ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 200ms',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                <User style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px', color: 'white' }}>Practice</h3>
                <p style={{ fontSize: '12px', color: '#78716c', margin: 0, lineHeight: 1.4 }}>Solo coding practice with editor and problems.</p>
              </div>
            </div>

            {/* Interview */}
            <div
              onClick={() => setMode('interview')}
              style={{
                border: mode === 'interview' ? '2px solid #34d399' : '2px solid var(--dm-border)',
                background: mode === 'interview' ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 200ms',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6' }}>
                <Briefcase style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px', color: 'white' }}>Interview</h3>
                <p style={{ fontSize: '12px', color: '#78716c', margin: 0, lineHeight: 1.4 }}>Normal or AI-powered interview room.</p>
              </div>
            </div>
          </div>
        </div>

        {mode === 'interview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
             <label style={{ fontSize: '13px', color: '#a8a29e', fontWeight: 600 }}>Select Interview Type</label>
             <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setInterviewType('normal')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    background: interviewType === 'normal' ? 'rgba(52,211,153,0.1)' : 'transparent',
                    border: interviewType === 'normal' ? '1px solid #34d399' : '1px solid var(--dm-border)',
                    color: interviewType === 'normal' ? '#34d399' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontWeight: 600
                  }}
                >
                  <Briefcase style={{ width: '16px', height: '16px' }} /> Normal Interview
                </button>
                <button
                  onClick={() => setInterviewType('ai')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    background: interviewType === 'ai' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                    border: interviewType === 'ai' ? '1px solid #c084fc' : '1px solid var(--dm-border)',
                    color: interviewType === 'ai' ? '#c084fc' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontWeight: 600
                  }}
                >
                  <Bot style={{ width: '16px', height: '16px' }} /> AI Interview
                </button>
             </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={!mode || (mode === 'interview' && !interviewType)}
          style={{
            background: (!mode || (mode === 'interview' && !interviewType)) ? 'rgba(52,211,153,0.5)' : '#34d399',
            color: '#080a0f', border: 'none', borderRadius: '8px', padding: '14px',
            fontSize: '16px', fontWeight: 700, cursor: (!mode || (mode === 'interview' && !interviewType)) ? 'not-allowed' : 'pointer',
            transition: 'all 200ms', marginTop: '8px'
          }}
        >
          Create Room
        </button>
      </div>
    </div>
  );
}
