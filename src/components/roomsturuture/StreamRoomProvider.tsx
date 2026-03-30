"use client";

import { useEffect, useState, ReactNode } from "react";
import {
  StreamVideo, StreamVideoClient, StreamCall, StreamTheme,
  VideoPreview, useCallStateHooks, useCall
} from "@stream-io/video-react-sdk";
import { useSession } from "next-auth/react";
import { Video, Loader2, VideoOff, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!;

export function StreamRoomProvider({ roomId, children }: { roomId: string, children: ReactNode }) {
  const { data: session } = useSession();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionUser = session?.user as any;
    let id = sessionUser?._id || sessionUser?.id;
    if (!id) {
      id = window.localStorage.getItem("stream_user_id");
      if (!id) {
        id = "anon_" + Math.random().toString(36).slice(2, 10);
        window.localStorage.setItem("stream_user_id", id);
      }
    }
    setUser({
      id,
      name: sessionUser?.name || id,
      image: sessionUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(sessionUser?.name || id)}&background=12141a&color=34d399`,
    });
  }, [session]);

  useEffect(() => {
    if (!user?.id || token) return; // Prevent double-fetching in React Strict Mode
    let isMounted = true;
    
    fetch("/api/stream-video-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
      .then(r => r.json())
      .then(d => { 
        if (!isMounted) return;
        if (d.token) setToken(d.token); 
        else setError(d.error || "Failed to get video token"); 
      })
      .catch(e => { if (isMounted) setError(e.message || "Failed to get token"); });
      
    return () => { isMounted = false; };
  }, [user?.id, token]);

  useEffect(() => {
    if (!API_KEY || !user || !token || client) return; // Prevent remount multi-instancing
    
    const c = new StreamVideoClient({ apiKey: API_KEY, user, token });
    const callInstance = c.call("default", roomId);
    
    setClient(c);
    setCall(callInstance);

    return () => {
      // Allow Stream SDK garbage collector to handle dead connections instead of aggressively severing WebSockets.
    };
  }, [roomId, user?.id, token, client]);

  const centerStyle: React.CSSProperties = {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "20px", textAlign: "center", gap: "12px",
    background: "var(--dm-surface)", height: "100%", width: "100%"
  };

  if (error) return (
    <div style={centerStyle}>
      <VideoOff style={{ width: "28px", height: "28px", color: "#f87171" }} />
      <p style={{ fontSize: "12px", color: "#f87171" }}>Video Call Error: {error}</p>
    </div>
  );

  if (!client || !call) return (
    <div style={centerStyle}>
      <Loader2 className="animate-spin text-emerald-400 w-6 h-6" />
      <p style={{ fontSize: "14px", color: "#78716c" }}>Initializing communication secure line...</p>
    </div>
  );

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme as="main" className="my-theme" style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
          <PreJoinLobby>{children}</PreJoinLobby>
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
}

// Sub-component inside StreamTheme to handle the Pre-Join Preview before rendering `children`
function PreJoinLobby({ children }: { children: ReactNode }) {
  const call = useCall();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { microphone, isMute: isMicMute } = useMicrophoneState();
  const { camera, isMute: isCamMute } = useCameraState();
  
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Hardware state is securely synced inside handleJoin. 
  // We do not aggressively run call.camera.disable() in useEffect because it creates a fatal race condition
  // against Stream's native `<VideoPreview />` mounting logic, which often freezes the entire SFU participant list.

  const handleJoin = async () => {
    if (!call) return;
    setIsJoining(true);
    try {
      // Pre-emptively disable hardware before joining to prevent "flash-on"
      try { if (isMicMute) await call.microphone.disable(); } catch (e) {}
      try { if (isCamMute) await call.camera.disable(); } catch (e) {}

      await call.join({ create: true });
      
      setIsJoined(true);
    } catch (err: any) {
      console.error("Failed to join call", err);
    } finally {
      setIsJoining(false);
    }
  };

  // If already joined, render the actual room with the real-time event watcher
  if (isJoined) {
    return (
      <>
        <CallEventNotifier />
        {children}
      </>
    );
  }

  // Preview Lobby
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--dm-surface)", height: "100%", width: "100%"
    }}>
      <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--dm-text)", marginBottom: "24px" }}>Ready to join?</h2>
      
      <div style={{
        width: "480px", maxWidth: "90%", background: "#080a0f", borderRadius: "16px",
        overflow: "hidden", border: "1px solid var(--dm-border)", position: "relative",
        aspectRatio: "16/9", marginBottom: "32px",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {/* Stream's native video preview automatically renders the active camera */}
        {!isCamMute ? (
          <VideoPreview />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "32px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
               <VideoOff style={{ color: "white", width: "32px", height: "32px" }} />
            </div>
            <span style={{ color: "white", fontSize: "14px" }}>Camera is off</span>
          </div>
        )}

        {/* Floating Controls inside the preview box */}
        <div style={{ position: "absolute", bottom: "16px", display: "flex", gap: "12px", zIndex: 10 }}>
          <button 
            onClick={() => microphone.toggle()}
            style={{
              width: "48px", height: "48px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)",
              background: isMicMute ? "#ef4444" : "rgba(0,0,0,0.6)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(5px)"
            }}
          >
            {isMicMute ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <button 
            onClick={() => camera.toggle()}
            style={{
              width: "48px", height: "48px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)",
              background: isCamMute ? "#ef4444" : "rgba(0,0,0,0.6)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(5px)"
            }}
          >
            {isCamMute ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        </div>
      </div>

      <button onClick={handleJoin} disabled={isJoining}
        style={{
          padding: "12px 32px", borderRadius: "24px", background: "#34d399", color: "#080a0f",
          fontWeight: 700, fontSize: "15px", border: "none", cursor: isJoining ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s hover:opacity-90"
        }}
      >
        {isJoining ? <><Loader2 className="animate-spin w-4 h-4" /> Joining...</> : "Join Room"}
      </button>
    </div>
  );
}

// Invisible daemon component that watches absolute network-level joins/leaves
function CallEventNotifier() {
  const call = useCall();

  useEffect(() => {
    if (!call) return;

    const handleParticipantJoined = (event: any) => {
      const name = event.participant?.user?.name || "A participant";
      toast.success(`${name} joined the room`, { position: "bottom-left" });
    };

    const handleParticipantLeft = (event: any) => {
      const name = event.participant?.user?.name || "A participant";
      toast.info(`${name} left the room`, { position: "bottom-left" });
    };

    call.on("call.session_participant_joined", handleParticipantJoined);
    call.on("call.session_participant_left", handleParticipantLeft);

    return () => {
      call.off("call.session_participant_joined", handleParticipantJoined);
      call.off("call.session_participant_left", handleParticipantLeft);
    };
  }, [call]);

  return null;
}
