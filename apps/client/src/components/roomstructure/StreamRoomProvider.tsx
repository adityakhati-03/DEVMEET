/**
 * StreamRoomProvider — adapted from src/components/roomsturuture/StreamRoomProvider.tsx
 *
 * Key changes:
 * - Removed useSession from next-auth/react — user data passed as props from RoomPage
 * - Removed NEXT_PUBLIC_* env vars → VITE_* env vars
 * - Token fetching via getStreamToken prop (instead of direct fetch('/api/stream-video-token'))
 * - userId now comes from JWT (server-side), not from localStorage fallback
 */

import { useEffect, useState, ReactNode } from 'react';
import {
  StreamVideo, StreamVideoClient, StreamCall, StreamTheme,
  VideoPreview, useCallStateHooks, useCall, Call, User,
  PaginatedGridLayout, CallControls
} from '@stream-io/video-react-sdk';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Video, Loader2, VideoOff, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

const API_KEY = import.meta.env.VITE_STREAM_VIDEO_API_KEY as string;

interface StreamRoomProviderProps {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  getStreamToken: () => Promise<string>;
  children: ReactNode;
}

export default function StreamRoomProvider({
  roomId, userId, userName, userAvatar, getStreamToken, children,
}: StreamRoomProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch Stream token from Express backend (userId derived from JWT server-side)
  useEffect(() => {
    let isMounted = true;
    if (token) return;

    getStreamToken()
      .then((t) => { if (isMounted) setToken(t); })
      .catch((e: Error) => { if (isMounted) setError(e.message || 'Failed to get video token'); });

    return () => { isMounted = false; };
  }, [getStreamToken, token]);

  // Initialize Stream client once token is ready
  useEffect(() => {
    if (!API_KEY || !userId || !token) return;

    const streamUser: User = {
      id: userId,
      name: userName,
      image: userAvatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=12141a&color=34d399`,
    };

    // @ts-ignore – StreamVideoClient has complex overloaded constructor types
    const c = new StreamVideoClient({ apiKey: API_KEY, user: streamUser, token });
    const callInstance = c.call('default', roomId);

    setClient(c);
    setCall(callInstance);

    return () => {
      c.disconnectUser();
      setClient(null);
      setCall(null);
    };
  }, [roomId, userId, userName, userAvatar, token]);

  const centerStyle: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '20px', textAlign: 'center', gap: '12px',
    background: 'var(--dm-surface)', height: '100%', width: '100%'
  };

  if (error) return (
    <div style={centerStyle}>
      <VideoOff style={{ width: '28px', height: '28px', color: '#f87171' }} />
      <p style={{ fontSize: '12px', color: '#f87171' }}>Video Call Error: {error}</p>
    </div>
  );

  if (!client || !call) return (
    <div style={centerStyle}>
      <Loader2 className="animate-spin text-emerald-400 w-6 h-6" />
      <p style={{ fontSize: '14px', color: '#78716c' }}>Initializing secure video line...</p>
    </div>
  );

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        {/* StreamTheme renders as <main> — must be told to fill the screen */}
        <StreamTheme as="div" className="my-theme" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', overflow: 'hidden' }}>
          <PreJoinLobby>{children}</PreJoinLobby>
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
}

// ── PreJoinLobby ──────────────────────────────────────────────────────────────

function PreJoinLobby({ children }: { children: ReactNode }) {
  const call = useCall();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { microphone, isMute: isMicMute } = useMicrophoneState();
  const { camera, isMute: isCamMute } = useCameraState();

  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!call) return;
    setIsJoining(true);
    try {
      try { if (isMicMute) await call.microphone.disable(); } catch {}
      try { if (isCamMute) await call.camera.disable(); } catch {}
      await call.join({ create: true });
      setIsJoined(true);
    } catch (err: unknown) {
      console.error('Failed to join call', err);
    } finally {
      setIsJoining(false);
    }
  };

  if (isJoined) {
    return (
      <>
        <CallEventNotifier />
        {/* Full-viewport split: Editor (left) + Video (right) */}
        <PanelGroup
          direction="horizontal"
          style={{ width: '100%', height: '100%' }}
        >
          {/* ── Code Editor pane ── */}
          <Panel defaultSize={80} minSize={40} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {children}
          </Panel>

          {/* ── Drag handle ── */}
          <PanelResizeHandle
            style={{ width: '4px', background: 'rgba(255,255,255,0.06)', cursor: 'col-resize', transition: 'background 0.15s', zIndex: 10, flexShrink: 0 }}
            onDragging={(isDragging) => {
              document.body.style.cursor = isDragging ? 'col-resize' : '';
            }}
          />

          {/* ── Video / Participants pane ── */}
          <Panel defaultSize={20} minSize={15} style={{ display: 'flex', flexDirection: 'column', background: '#0d0f14', overflow: 'hidden' }}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <PaginatedGridLayout />
            </div>
            <div style={{ flexShrink: 0, padding: '12px 8px', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center' }}>
              <CallControls />
            </div>
          </Panel>
        </PanelGroup>
      </>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dm-surface)', height: '100%', width: '100%' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--dm-text)', marginBottom: '24px' }}>Ready to join?</h2>

      <div style={{ width: '480px', maxWidth: '90%', background: '#080a0f', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--dm-border)', position: 'relative', aspectRatio: '16/9', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!isCamMute ? (
          <VideoPreview />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VideoOff style={{ color: 'white', width: '32px', height: '32px' }} />
            </div>
            <span style={{ color: 'white', fontSize: '14px' }}>Camera is off</span>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '16px', display: 'flex', gap: '12px', zIndex: 10 }}>
          <button onClick={() => microphone.toggle()}
            style={{ width: '48px', height: '48px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: isMicMute ? '#ef4444' : 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
            {isMicMute ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button onClick={() => camera.toggle()}
            style={{ width: '48px', height: '48px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: isCamMute ? '#ef4444' : 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
            {isCamMute ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        </div>
      </div>

      <button onClick={handleJoin} disabled={isJoining}
        style={{ padding: '12px 32px', borderRadius: '24px', background: '#34d399', color: '#080a0f', fontWeight: 700, fontSize: '15px', border: 'none', cursor: isJoining ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isJoining ? <><Loader2 className="animate-spin w-4 h-4" /> Joining...</> : 'Join Room'}
      </button>
    </div>
  );
}

// ── CallEventNotifier ─────────────────────────────────────────────────────────

function CallEventNotifier() {
  const call = useCall();

  useEffect(() => {
    if (!call) return;

    const handleJoined = (event: { participant?: { user?: { name?: string } } }) => {
      toast.success(`${event.participant?.user?.name ?? 'A participant'} joined`, { position: 'bottom-left' });
    };
    const handleLeft = (event: { participant?: { user?: { name?: string } } }) => {
      toast.info(`${event.participant?.user?.name ?? 'A participant'} left`, { position: 'bottom-left' });
    };

    call.on('call.session_participant_joined', handleJoined);
    call.on('call.session_participant_left', handleLeft);

    return () => {
      call.off('call.session_participant_joined', handleJoined);
      call.off('call.session_participant_left', handleLeft);
    };
  }, [call]);

  return null;
}
