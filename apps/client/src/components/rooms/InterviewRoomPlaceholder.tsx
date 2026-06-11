import React from 'react';
import type { IRoom } from '@devmeet/shared';

interface InterviewRoomPlaceholderProps {
  room: IRoom;
}

export default function InterviewRoomPlaceholder({ room }: InterviewRoomPlaceholderProps) {
  const isAI = room.interviewType === 'ai';
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--dm-bg)' }}>
      <div style={{ padding: '16px', background: 'var(--dm-surface)', borderBottom: '1px solid var(--dm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'white' }}>
          {room.title || 'Interview Room'}
        </h2>
        <span style={{ fontSize: '13px', color: isAI ? '#c084fc' : '#f472b6', background: isAI ? 'rgba(168, 85, 247, 0.1)' : 'rgba(236, 72, 153, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
          {isAI ? 'AI Interview Mode' : 'Normal Interview Mode'}
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78716c' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '8px' }}>Interview mode workflow coming next</h3>
          <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
            {isAI 
              ? 'This will be an automated AI-driven interview session where the AI acts as the interviewer.' 
              : 'This will be a structured technical interview session with a real interviewer.'}
          </p>
        </div>
      </div>
    </div>
  );
}
