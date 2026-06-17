import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CollaborationProvider } from '../collaboration/CollaborationProvider';
import { useAuth } from '../context/AuthContext';
import { roomService } from '../services/roomService';
import { streamService } from '../services/streamService';
import type { IRoom } from '@devmeet/shared';
import StreamRoomProvider from '../components/roomstructure/StreamRoomProvider';
import CollabRoomContainer from './CollabRoomContainer';
import PracticeRoomContainer from './PracticeRoomContainer';
import NormalInterviewLayout from '../components/interview/NormalInterviewLayout';
import AIInterviewContainer from './AIInterviewContainer';
import InterviewRoomPlaceholder from '../components/rooms/InterviewRoomPlaceholder';
import RoomFullscreenButton from '../components/RoomFullscreenButton';
import RoomCopyLinkButton from '../components/RoomCopyLinkButton';
import LoadingSpinner from '../components/ui/LoadingSpinner';

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

  const fetchRoom = useCallback(async () => {
    try {
      let fetchedRoom: IRoom;
      try {
        fetchedRoom = await roomService.getRoom(roomId!);
      } catch {
        try {
          fetchedRoom = await roomService.joinRoom(roomId!);
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
  }, [roomId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (!roomId) { setError('No room ID provided'); setLoading(false); return; }

    fetchRoom();
  }, [roomId, user, authLoading, navigate, fetchRoom]);

  useEffect(() => {
    const handleRoomUpdate = () => {
      fetchRoom();
    };
    window.addEventListener('roomProblemUpdated', handleRoomUpdate);
    return () => window.removeEventListener('roomProblemUpdated', handleRoomUpdate);
  }, [fetchRoom]);

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dm-bg)', gap: '24px' }}>
        <p style={{ color: '#ef4444', fontFamily: '"JetBrains Mono", monospace', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="dm-btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!room || !user) return null;

  if (room.mode === 'practice') {
    return (
      <>
        <RoomFullscreenButton />
        <RoomCopyLinkButton roomId={roomId!} />
        <PracticeRoomContainer initialRoom={room} />
      </>
    );
  }

  if (room.mode === 'interview') {
    if (room.interviewType === 'normal') {
      return (
        <>
          <RoomFullscreenButton />
          <RoomCopyLinkButton roomId={roomId!} />
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
        </>
      );
    }
    if (room.interviewType === 'ai') {
      return (
        <>
          <RoomFullscreenButton />
          <RoomCopyLinkButton roomId={roomId!} />
          <AIInterviewContainer room={room} />
        </>
      );
    }
    return (
      <>
        <RoomFullscreenButton />
        <RoomCopyLinkButton roomId={roomId!} />
        <InterviewRoomPlaceholder room={room} />
      </>
    );
  }

  return (
    <>
      <RoomFullscreenButton />
      <RoomCopyLinkButton roomId={roomId!} />
      <CollabRoomContainer 
        room={room}
        currentUser={{
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
        }}
      />
    </>
  );
}
