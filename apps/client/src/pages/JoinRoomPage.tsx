import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, TerminalSquare, ArrowRight } from 'lucide-react';

export default function JoinRoomPage() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/rooms/${roomId.trim()}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dm-bg)', padding: '40px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="dm-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', background: 'var(--dm-accent)', padding: '16px', border: '4px solid #000', marginBottom: '24px', boxShadow: '4px 4px 0px rgba(0,0,0,1)', transform: 'rotate(-5deg)' }}>
            <TerminalSquare size={40} color="#000" />
          </div>
          <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, fontSize: '32px', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Join a Session
          </h1>
          <p style={{ color: 'var(--dm-muted)', fontFamily: '"JetBrains Mono", monospace', margin: 0, fontSize: '14px' }}>
            Paste the Room ID below to connect with your peers.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label 
              htmlFor="room-id"
              style={{ 
                fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, fontSize: '14px', 
                textTransform: 'uppercase', marginBottom: '8px', display: 'block', color: 'var(--dm-text)' 
              }}
            >
              Room ID
            </label>
            <input
              id="room-id"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. x8k2m9p1q"
              className="dm-input"
              style={{ 
                width: '100%', 
                fontSize: '20px', 
                padding: '20px', 
                textAlign: 'center',
                letterSpacing: '0.1em',
                fontWeight: 700
              }}
              autoComplete="off"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!roomId.trim()}
            className="dm-btn-primary"
            style={{ 
              width: '100%', 
              padding: '20px', 
              fontSize: '18px',
              opacity: !roomId.trim() ? 0.5 : 1
            }}
          >
            <LogIn size={20} /> Enter Room <ArrowRight size={20} />
          </button>
        </form>

      </div>
    </div>
  );
}
