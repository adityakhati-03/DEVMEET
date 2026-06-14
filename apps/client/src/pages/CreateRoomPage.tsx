import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, Bot, Briefcase, Plus, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { roomService } from '../services/roomService';
import type { RoomMode, InterviewType } from '@devmeet/shared';

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: '"Space Grotesk", sans-serif',
  fontWeight: 800,
  fontSize: '16px',
  textTransform: 'uppercase',
  letterSpacing: '-0.02em',
  marginBottom: '12px',
  color: 'var(--dm-text)',
};

export default function CreateRoomPage() {
  const [mode, setMode] = useState<RoomMode | null>(null);
  const [interviewType, setInterviewType] = useState<InterviewType>(null);
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [roomId] = useState(() => Math.random().toString(36).substring(2, 12));
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopy = () => {
    const link = `${window.location.origin}/rooms/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Room link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (!mode) return;
    if (mode === 'interview' && !interviewType) return;
    
    setIsCreating(true);
    try {
      await roomService.createRoom({
        roomId,
        mode,
        interviewType,
        title
      });
      toast.success('Room created successfully!');
      navigate(`/rooms/${roomId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create room');
      setIsCreating(false);
    }
  };

  const OptionCard = ({ 
    active, onClick, icon, titleText, description 
  }: { 
    active: boolean, onClick: () => void, icon: React.ReactNode, titleText: string, description: string 
  }) => (
    <div 
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? 'var(--dm-accent)' : 'var(--dm-bg)',
        color: active ? '#000' : 'var(--dm-text)',
        border: '4px solid var(--dm-border)',
        padding: '24px',
        cursor: 'pointer',
        boxShadow: active ? '6px 6px 0px rgba(0,0,0,1)' : '4px 4px 0px rgba(0,0,0,0.1)',
        transform: active ? 'translate(-2px, -2px)' : 'none',
        transition: 'all 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon}
        <h3 style={{ margin: 0, fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, fontSize: '18px', textTransform: 'uppercase' }}>
          {titleText}
        </h3>
      </div>
      <p style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', opacity: 0.8, lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dm-bg)', padding: '40px 24px', display: 'flex', justifyContent: 'center' }}>
      <div className="dm-card animate-slide-up" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, fontSize: '32px', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Customize Your Room
          </h1>
          <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', margin: 0, fontSize: '14px' }}>
            Configure your environment before spinning it up.
          </p>
        </div>

        {/* Room ID Display & Copy */}
        <div style={{ background: 'var(--dm-card)', border: '4px solid var(--dm-border)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <label style={{ ...sectionTitleStyle, marginBottom: '4px', display: 'block' }}>Room ID</label>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '24px', fontWeight: 800, color: 'var(--dm-accent)' }}>
              {roomId}
            </span>
          </div>
          <button 
            onClick={handleCopy}
            className="dm-btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px' }}
          >
            {copied ? <CheckCircle2 size={18} color="#34d399" /> : <Copy size={18} />}
            {copied ? 'Copied Link!' : 'Copy Invite Link'}
          </button>
        </div>

        {/* Title Input */}
        <div>
          <label style={sectionTitleStyle}>Room Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. System Design Interview"
            className="dm-input"
            style={{ width: '100%' }}
            disabled={isCreating}
          />
        </div>

        {/* Mode Selection */}
        <div>
          <label style={sectionTitleStyle}>Select Room Mode</label>
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
            <OptionCard 
              active={mode === 'collaboration'}
              onClick={() => { setMode('collaboration'); setInterviewType(null); }}
              icon={<Users size={24} />}
              titleText="Collaboration"
              description="Real-time multi-user code editor with integrated video conferencing."
            />
            <OptionCard 
              active={mode === 'practice'}
              onClick={() => { setMode('practice'); setInterviewType(null); }}
              icon={<User size={24} />}
              titleText="Practice"
              description="Solo environment to grind algorithms and solve coding challenges."
            />
            <OptionCard 
              active={mode === 'interview'}
              onClick={() => setMode('interview')}
              icon={<Briefcase size={24} />}
              titleText="Interview"
              description="Mock interviews with other peers or our advanced AI interviewer."
            />
          </div>
        </div>

        {/* Interview Type Selection */}
        {mode === 'interview' && (
          <div className="animate-slide-up" style={{ padding: '24px', background: 'var(--dm-card)', border: '4px solid var(--dm-border)', borderStyle: 'dashed' }}>
             <label style={sectionTitleStyle}>Select Interview Type</label>
             <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <button
                  onClick={() => setInterviewType('normal')}
                  className={interviewType === 'normal' ? 'dm-btn-primary' : 'dm-btn-ghost'}
                  style={{ flex: 1, padding: '16px' }}
                >
                  <Briefcase size={20} /> Peer Interview
                </button>
                <button
                  onClick={() => setInterviewType('ai')}
                  className={interviewType === 'ai' ? 'dm-btn-primary' : 'dm-btn-ghost'}
                  style={{ flex: 1, padding: '16px' }}
                >
                  <Bot size={20} /> AI Interview
                </button>
             </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="dm-btn-ghost"
            style={{ flex: 1, padding: '16px', fontSize: '16px' }}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!mode || (mode === 'interview' && !interviewType) || isCreating}
            className="dm-btn-primary"
            style={{ 
              flex: 2, 
              padding: '16px', 
              fontSize: '16px',
              opacity: (!mode || (mode === 'interview' && !interviewType)) ? 0.5 : 1
            }}
          >
            {isCreating ? (
              <><Loader2 size={20} className="animate-spin" /> Provisioning Room...</>
            ) : (
              <><Plus size={20} /> Create Room</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
