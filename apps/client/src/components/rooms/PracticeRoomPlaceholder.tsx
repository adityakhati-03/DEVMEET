import React from 'react';
import type { IRoom } from '@devmeet/shared';

interface PracticeRoomPlaceholderProps {
  room: IRoom;
}

export default function PracticeRoomPlaceholder({ room }: PracticeRoomPlaceholderProps) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--dm-bg)' }}>
      <div style={{ padding: '16px', background: 'var(--dm-surface)', borderBottom: '1px solid var(--dm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'white' }}>
          {room.title || 'Practice Room'}
        </h2>
        <span style={{ fontSize: '13px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
          Practice Mode
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78716c' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '8px' }}>Practice mode problem system coming next</h3>
          <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
            You will soon be able to select problems, view descriptions here, and write your solution in the editor.
          </p>
        </div>
      </div>
    </div>
  );
}
