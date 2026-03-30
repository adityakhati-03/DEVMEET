'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Room } from "@/components/roomsturuture/Room";
import { StreamRoomProvider } from "@/components/roomsturuture/StreamRoomProvider";
import { CollaborativeEditor } from "@/components/editor/CollaborativeEditor";
import { BottomBar } from "@/components/roomsturuture/BottomBar";
import { InCallChat } from "@/components/roomsturuture/InCallChat";
import { ParticipantsPanel } from "@/components/roomsturuture/ParticipantsPanel";
import { ParticipantView, useCallStateHooks, useCall, useParticipantViewContext } from "@stream-io/video-react-sdk";
import { Loading } from "@/components/Loading";
import { toast } from "sonner";
import { MoreVertical, MicOff, Pin, PinOff, CameraOff, VideoOff, UserMinus } from "lucide-react";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { status } = useSession();
  const router = useRouter();

  const [activePanel, setActivePanel] = useState<"chat" | "participants" | "closed">("closed");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/sign-in");
  }, [status, router]);

  if (status === "loading" || !roomId) return <Loading />;

  return (
    <Room roomId={roomId}>
      <StreamRoomProvider roomId={roomId}>
        
        <div 
          id="devmeet-room-container"
          style={{
            display: "flex", flexDirection: "column", height: "100vh",
            background: "var(--dm-bg)", overflow: "hidden", position: "relative"
          }}
        >
          
          <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: "16px", gap: "16px" }}>
            
            {/* ── MAIN STAGE (Editor or Pinned Video) ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "var(--dm-surface)", borderRadius: "16px", border: "1px solid var(--dm-border)" }}>
               <DynamicMainStage />
            </div>

            {/* ── UNIFIED RIGID SIDEBAR (Never resizes Main Stage) ── */}
            <div style={{ 
              width: "340px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px", height: "100%"
            }}>
              
              {/* VIDEO STRIP - ALWAYS IN DOM, HIDDEN VIA CSS to preserve WebRTC WebSocket streams! */}
              <div style={{ flex: 1, overflow: "hidden", display: activePanel === "closed" ? "flex" : "none", flexDirection: "column", borderRadius: "16px", background: "var(--dm-bg)", border: "1px solid var(--dm-border)", position: "relative" }}>
                 <DynamicSidebarVideo />
              </div>

              {/* CHAT / PARTICIPANTS */}
              <div style={{ flex: 1, background: "var(--dm-surface)", borderRadius: "16px", border: "1px solid var(--dm-border)", overflow: "hidden", display: activePanel !== "closed" ? "flex" : "none", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                {activePanel === "chat" && <InCallChat />}
                {activePanel === "participants" && <ParticipantsPanel />}
              </div>

            </div>
            
          </div>

          <BottomBar roomId={roomId} activePanel={activePanel} setActivePanel={setActivePanel} />
          
        </div>

      </StreamRoomProvider>
    </Room>
  );
}

// Custom Hook to violently guarantee Host isn't blocked by Stream's implicit "Audience" filters
function useUnifiedParticipants() {
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const rawParticipants = useParticipants();
  const localParticipant = useLocalParticipant();
  
  const participants = [...rawParticipants];
  if (localParticipant) {
    if (!participants.some((p) => p.sessionId === localParticipant.sessionId)) {
      participants.unshift(localParticipant);
    }
  }
  return participants;
}

// Built-from-scratch grid replacement for PaginatedGridLayout to prevent opaque rendering collapses
function ResilientVideoGrid({ participants }: { participants: any[] }) {
  if (participants.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dm-muted)" }}>
        Waiting for stream...
      </div>
    );
  }

  const count = participants.length;
  const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;

  return (
    <div style={{
      width: "100%", height: "100%", overflowY: "auto",
      display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: "20px", padding: "20px", alignContent: "flex-start"
    }}>
      {participants.map((p) => (
         <div key={p.sessionId} style={{ 
            width: "100%", aspectRatio: "16/9", borderRadius: "0px", 
            overflow: "visible", background: "var(--dm-bg)", border: "1px solid var(--dm-border)",
            position: "relative"
          }}>
            <ParticipantView 
               participant={p} 
               ParticipantViewUI={null} // Nullifies Stream's ugly default text overlays
               VideoPlaceholder={VideoFallback} // High-end avatar replacement
            />
            {/* Our High-End Custom UI Badges overlaying the stream */}
            <NSOCParticipantBadge participant={p} />
         </div>
      ))}
    </div>
  );
}

// Custom Placeholder for when the camera is disabled — looks better than the default initials
function VideoFallback() {
  const { participant } = useParticipantViewContext();
  
  return (
    <div style={{
      width: "100%", height: "100%", 
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(circle at center, var(--dm-surface) 0%, var(--dm-bg) 100%)",
      gap: "20px"
    }}>
      <div style={{ position: "relative" }}>
        <div style={{
           width: "90px", height: "90px", borderRadius: "45px", overflow: "hidden",
           border: "3px solid var(--dm-border)", boxShadow: "0 0 40px rgba(0,0,0,0.2)",
           display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dm-surface)"
        }}>
          {participant.image ? (
            <img src={participant.image} alt={participant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=12141a&color=34d399`} alt={participant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <div style={{ 
          position: "absolute", bottom: "-2px", right: "-2px",
          width: "28px", height: "28px", borderRadius: "14px", background: "var(--dm-surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid var(--dm-bg)"
        }}>
          <CameraOff size={14} color="var(--dm-muted)" />
        </div>
      </div>
      <div style={{ 
        display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" 
      }}>
        <span style={{ color: "var(--dm-text)", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em" }}>{participant.name}</span>
      </div>
    </div>
  );
}

// Custom Glassmorphic overlay taking complete aesthetic control over Participant Cells
function NSOCParticipantBadge({ participant }: { participant: any }) {
  const call = useCall();
  const { useMicrophoneState, useLocalParticipant } = useCallStateHooks();
  const { isMute: isLocalMicMute } = useMicrophoneState();
  const localParticipant = useLocalParticipant();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const hostId = call?.state?.createdBy?.id;
  const isHost = localParticipant?.userId === hostId;
  const isMe = localParticipant?.userId === participant.userId;
  
  // Instantly sync local mic state without waiting for SFU broadcast
  const isMicOn = participant.isLocalParticipant 
     ? !isLocalMicMute 
     : participant.publishedTracks.includes("audio");
     
  const isPinned = participant.pin;

  return (
    <div style={{
      position: "absolute", bottom: "16px", left: "16px", right: "16px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      zIndex: 50
    }}>
      
      {/* Mic Status Tag (Participant Text Removed as per user request) */}
      <div style={{
        background: "rgba(10, 12, 18, 0.7)", backdropFilter: "blur(16px)",
        padding: "8px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", gap: "6px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
      }}>
        <div style={{ 
          width: "8px", height: "8px", borderRadius: "4px", 
          background: isMicOn ? "#34d399" : "#78716c",
          boxShadow: isMicOn ? "0 0 10px #34d399" : "none"
        }} />
        {!isMicOn && <MicOff size={14} color="#f87171" />}
      </div>
      
      {/* Action Buttons Area */}
      <div style={{ display: "flex", gap: "8px", position: "relative" }}>
        
        {/* Quick Pin Toggle */}
        <button 
          onClick={async (e) => {
             e.stopPropagation();
             if (isPinned) await call?.unpin(participant.sessionId);
             else await call?.pin(participant.sessionId);
          }}
          title={isPinned ? "Unpin" : "Pin"}
          style={{
            background: isPinned ? "rgba(52, 211, 153, 0.15)" : "rgba(10, 12, 18, 0.6)", 
            backdropFilter: "blur(16px)",
            width: "36px", height: "36px", borderRadius: "18px", 
            border: isPinned ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: isPinned ? "#34d399" : "white", flexShrink: 0,
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}
        >
          {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
        </button>
        
        {/* The REAL Menu Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          style={{
            background: isMenuOpen ? "rgba(255,255,255,0.15)" : "rgba(10, 12, 18, 0.6)", 
            backdropFilter: "blur(16px)",
            width: "36px", height: "36px", borderRadius: "18px", 
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "white", flexShrink: 0,
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}>
          <MoreVertical size={18} />
        </button>

        {/* Floating Participant Dropdown Menu */}
        {isMenuOpen && (
          <div 
            onMouseLeave={() => setIsMenuOpen(false)}
            style={{
              position: "absolute", top: "48px", right: "0", bottom: "auto",
              width: "180px", background: "var(--dm-surface)", borderRadius: "16px",
              border: "1px solid var(--dm-border)", overflow: "hidden",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
              zIndex: 100,
              padding: "6px"
            }}
          >
            <button 
              onClick={async () => {
                if (isPinned) await call?.unpin(participant.sessionId);
                else await call?.pin(participant.sessionId);
                setIsMenuOpen(false);
              }}
              style={{ width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", color: "var(--dm-text)", fontSize: "13px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "10px", transition: "background 0.2s" }}
              className="hover:bg-black/5 dark:hover:bg-white/5"
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />} {isPinned ? "Unpin participant" : "Pin participant"}
            </button>
            
            {isHost && !isMe && (
              <>
                <button 
                  onClick={async () => {
                    if (!call) return;
                    try {
                      await call.muteUser(participant.userId, "audio");
                      toast.success(`Muted ${participant.name || 'participant'}`);
                    } catch (e: any) {
                      toast.error("Failed to mute audio. Permissions missing?");
                    }
                    setIsMenuOpen(false);
                  }}
                  style={{ width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", color: "var(--dm-text)", fontSize: "13px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "10px", transition: "background 0.2s" }}
                  className="hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <MicOff size={14} /> Mute participant
                </button>

                <button 
                  onClick={async () => {
                    if (!call) return;
                    try {
                      await call.muteUser(participant.userId, "video");
                      toast.success(`Paused ${participant.name || 'participant'}'s video`);
                    } catch (e: any) {
                      toast.error("Failed to pause video. Permissions missing?");
                    }
                    setIsMenuOpen(false);
                  }}
                  style={{ width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", color: "var(--dm-text)", fontSize: "13px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "10px", transition: "background 0.2s" }}
                  className="hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <VideoOff size={14} /> Pause video
                </button>
                
                <div style={{ margin: "4px 0", height: "1px", background: "var(--dm-border)" }} />

                <button 
                  onClick={async () => {
                    if (!call) return;
                    try {
                      await call.removeMembers([participant.userId]);
                      toast.success(`Removed ${participant.name || 'participant'} from call`);
                    } catch (e: any) {
                      toast.error("Failed to remove participant. Host permissions required.");
                    }
                    setIsMenuOpen(false);
                  }}
                  style={{ width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", color: "#f87171", fontSize: "13px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "10px", transition: "background 0.2s" }}
                  className="hover:bg-red-500/10"
                >
                  <UserMinus size={14} /> Remove participant
                </button>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

// Hook wrapper for Main Stage routing
function DynamicMainStage() {
  const participants = useUnifiedParticipants();
  const hasPinned = participants.some((p) => p.pin);
  
  return hasPinned ? <ResilientVideoGrid participants={participants} /> : <CollaborativeEditor />;
}

// Hook wrapper for Sidebar routing
function DynamicSidebarVideo() {
  const participants = useUnifiedParticipants();
  const hasPinned = participants.some((p) => p.pin);
  
  return hasPinned ? <CollaborativeEditor /> : <ResilientVideoGrid participants={participants} />;
}
