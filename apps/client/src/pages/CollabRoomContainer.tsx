import { useEffect, useState } from 'react';
import type { IRoom, IProblem } from '@devmeet/shared';
import { problemService } from '../services/problemService';
import { streamService } from '../services/streamService';
import { CollaborationProvider } from '../collaboration/CollaborationProvider';
import StreamRoomProvider from '../components/roomstructure/StreamRoomProvider';
import CollabLayout from '../components/editor/CollabLayout';

interface CollabRoomContainerProps {
  room: IRoom;
  currentUser: { id: string; name: string; username: string; avatar: string | null };
}

export default function CollabRoomContainer({ room, currentUser }: CollabRoomContainerProps) {
  const [problem, setProblem] = useState<IProblem | null>(null);

  useEffect(() => {
    if (room.problemId) {
      problemService.getProblem(room.problemId as string)
        .then(setProblem)
        .catch(console.error);
    } else {
      setProblem(null);
    }
  }, [room.problemId]);

  return (
    <CollaborationProvider roomId={room.roomId} token={null}>
      <StreamRoomProvider
        roomId={room.roomId}
        userId={currentUser.id}
        userName={currentUser.name}
        userAvatar={currentUser.avatar ?? undefined}
        getStreamToken={() => streamService.getStreamToken(room.roomId)}
      >
        <CollabLayout room={room} problem={problem} currentUser={currentUser} />
      </StreamRoomProvider>
    </CollaborationProvider>
  );
}
