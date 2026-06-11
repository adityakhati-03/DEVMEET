import type { RoomMode, InterviewType } from '@devmeet/shared';
import { Users, User, Bot, Briefcase } from 'lucide-react';

interface RoomModeBadgeProps {
  mode: RoomMode;
  interviewType?: InterviewType;
}

export default function RoomModeBadge({ mode, interviewType }: RoomModeBadgeProps) {
  if (mode === 'collaboration') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '11px', fontWeight: 700, color: '#60a5fa', whiteSpace: 'nowrap' }}>
        <Users style={{ width: '12px', height: '12px' }} /> Collab
      </span>
    );
  }
  
  if (mode === 'practice') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '11px', fontWeight: 700, color: '#fbbf24', whiteSpace: 'nowrap' }}>
        <User style={{ width: '12px', height: '12px' }} /> Practice
      </span>
    );
  }

  if (mode === 'interview') {
    if (interviewType === 'ai') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', fontSize: '11px', fontWeight: 700, color: '#c084fc', whiteSpace: 'nowrap' }}>
          <Bot style={{ width: '12px', height: '12px' }} /> AI Interview
        </span>
      );
    }
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)', fontSize: '11px', fontWeight: 700, color: '#f472b6', whiteSpace: 'nowrap' }}>
        <Briefcase style={{ width: '12px', height: '12px' }} /> Interview
      </span>
    );
  }

  return null;
}
