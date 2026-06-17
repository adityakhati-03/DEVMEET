import type { IRoom, IProblem } from '@devmeet/shared';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import ProblemPanel from '../practice/ProblemPanel';
import CollaborativeEditor from './CollaborativeEditor';
import { useSharedState } from '../../collaboration/useCollaboration';

interface CollabLayoutProps {
  room: IRoom;
  problem: IProblem | null;
  currentUser: { id: string; name: string; username: string; avatar: string | null };
}

export default function CollabLayout({ room, problem, currentUser }: CollabLayoutProps) {
  const [language] = useSharedState<string>('language', 'JavaScript');
  const [, setInputValue] = useSharedState<string>('input', '');

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--dm-bg)', overflow: 'hidden' }}>
      <PanelGroup direction="horizontal" key={problem ? 'split' : 'full'}>
        {problem && (
          <Panel defaultSize={30} minSize={20}>
            <ProblemPanel
              problem={problem}
              room={room}
              onUseAsInput={(input) => setInputValue(input)}
              canSave={false}
              language={language}
            />
          </Panel>
        )}
        {problem && (
          <PanelResizeHandle style={{ width: '8px', cursor: 'col-resize', background: 'var(--dm-border)', transition: 'background 0.2s' }} />
        )}
        
        <Panel defaultSize={problem ? 70 : 100} minSize={30}>
          <CollaborativeEditor
            roomId={room.roomId}
            currentUser={currentUser}
            room={room}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
