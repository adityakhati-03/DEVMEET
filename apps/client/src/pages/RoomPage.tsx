import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CollaborationProvider } from '../collaboration/CollaborationProvider';
import { useAuth } from '../context/AuthContext';
import { roomService } from '../services/roomService';
import { streamService } from '../services/streamService';
import type { IRoom } from '@devmeet/shared';
import StreamRoomProvider from '../components/roomstructure/StreamRoomProvider';
import CollaborativeEditor from '../components/editor/CollaborativeEditor';
import PracticeRoomContainer from './PracticeRoomContainer';
import NormalInterviewLayout from '../components/interview/NormalInterviewLayout';
import AIInterviewContainer from './AIInterviewContainer';
import InterviewRoomPlaceholder from '../components/rooms/InterviewRoomPlaceholder';

/**
 * RoomPage — adapted from src/app/room/[roomId]/page.tsx
 *
 * Key changes from original:
 * - useParams from react-router-dom (no Next.js dynamic routes)
 * - useNavigate instead of useRouter
 * - useAuth instead of useSession
 * - Collaboration uses custom y-websocket CollaborationProvider (JWT cookie auth)
 * - Stream token fetched via streamService.getStreamToken (userId from JWT on server)
 * - VITE_* env vars used instead of NEXT_PUBLIC_*
 */



export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<IRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (!roomId) { setError('No room ID provided'); setLoading(false); return; }

    const fetchRoom = async () => {
      try {
        let fetchedRoom: IRoom;
        try {
          fetchedRoom = await roomService.getRoom(roomId);
        } catch {
          try {
            fetchedRoom = await roomService.joinRoom(roomId);
          } catch {
            setError('Room not found or you do not have access.');
            setLoading(false);
            return;
          }
        }
        setRoom(fetchedRoom);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId, user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080a0f' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(52,211,153,0.2)', borderTopColor: '#34d399', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#78716c', fontSize: '14px' }}>Loading room...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080a0f', gap: '16px' }}>
        <p style={{ color: '#f87171', fontSize: '16px' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 24px', background: '#34d399', color: '#080a0f', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!room || !user) return null;

  if (room.mode === 'practice') {
    return <PracticeRoomContainer initialRoom={room} />;
  }

  if (room.mode === 'interview') {
    if (room.interviewType === 'normal') {
      return (
        <CollaborationProvider roomId={roomId!} token={null}>
          <StreamRoomProvider
            roomId={roomId!}
            userId={user.id}
            userName={user.name}
            userAvatar={user.avatar ?? undefined}
            getStreamToken={() => streamService.getStreamToken(roomId)}
          >
            <NormalInterviewLayout 
              room={room}
              currentUser={{
                id: user.id,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
              }}
            />
          </StreamRoomProvider>
        </CollaborationProvider>
      );
    }
    if (room.interviewType === 'ai') {
      return <AIInterviewContainer room={room} />;
    }
    return <InterviewRoomPlaceholder room={room} />;
  }

  return (
    <CollaborationProvider roomId={roomId!} token={null}>
      <StreamRoomProvider
          roomId={roomId!}
          userId={user.id}
          userName={user.name}
          userAvatar={user.avatar ?? undefined}
          getStreamToken={() => streamService.getStreamToken(roomId)}
        >
          <CollaborativeEditor
            roomId={roomId!}
            currentUser={{
              id: user.id,
              name: user.name,
              username: user.username,
              avatar: user.avatar,
            }}
          />
      </StreamRoomProvider>
    </CollaborationProvider>
  );
}
