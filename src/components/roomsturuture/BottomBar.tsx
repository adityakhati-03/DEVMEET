"use client";

import { useCallStateHooks, useCall } from "@stream-io/video-react-sdk";
import { Copy, MessageSquare, Users, Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Maximize, Minimize } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function BottomBar({ 
  roomId, 
  activePanel, 
  setActivePanel,
}: { 
  roomId: string,
  activePanel: "chat" | "participants" | "closed",
  setActivePanel: (p: "chat" | "participants" | "closed") => void,
}) {
  const router = useRouter();
  const call = useCall();
  const { useMicrophoneState, useCameraState, useScreenShareState } = useCallStateHooks();
  
  const { microphone, isMute: isMicMute } = useMicrophoneState();
  const { camera, isMute: isCamMute } = useCameraState();
  const { screenShare, isMute: isScreenShareMute } = useScreenShareState();
  const amIScreenSharing = !isScreenShareMute;

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied!");
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const container = document.getElementById("devmeet-room-container");
        if (container?.requestFullscreen) {
          await container.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen error", err);
    }
  };

  const handleLeave = async () => {
    if (call) await call.leave();
    if (document.fullscreenElement) await document.exitFullscreen().catch(e => console.log(e));
    router.push("/dashboard");
  };

  const btnStyle = (isActive: boolean, type: "default" | "danger" = "default") => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: type === "danger" ? "56px" : "42px",
    height: "42px",
    borderRadius: type === "danger" ? "24px" : "20px",
    background: type === "danger" 
      ? "#ef4444" 
      : isActive 
        ? "rgba(52,211,153,0.15)" 
        : "rgba(255,255,255,0.08)",
    color: type === "danger" 
      ? "white" 
      : isActive 
        ? "#34d399" 
        : "#e2e8f0",
    border: type === "danger" 
      ? "none" 
      : isActive 
        ? "1px solid rgba(52,211,153,0.3)" 
        : "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer",
    transition: "all 0.2s"
  });

  return (
    <div style={{
      height: "80px",
      background: "var(--dm-bg)",
      borderTop: "1px solid var(--dm-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      flexShrink: 0
    }}>
      {/* Left items - Room Info */}
      <div style={{ display: "flex", alignItems: "center", width: "250px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "var(--dm-text)", fontSize: "15px", fontWeight: 600 }}>{roomId}</span>
          <button onClick={handleCopy} style={{ background: "transparent", border: "none", color: "var(--dm-muted)", cursor: "pointer", display: "flex", padding: "6px" }}>
            <Copy style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>

      {/* Center items - Core Call Controls perfectly styled to NSOC */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button 
          title={isMicMute ? "Turn on microphone" : "Turn off microphone"}
          onClick={() => microphone.toggle()}
          style={btnStyle(!isMicMute)}
        >
          {isMicMute ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button 
          title={isCamMute ? "Turn on camera" : "Turn off camera"}
          onClick={() => camera.toggle()}
          style={btnStyle(!isCamMute)}
        >
          {isCamMute ? <VideoOff size={18} /> : <Video size={18} />}
        </button>

        <button 
          title="Share screen"
          onClick={() => screenShare.toggle()}
          style={btnStyle(amIScreenSharing)}
        >
          <MonitorUp size={18} />
        </button>

        <button 
          title="Leave Call"
          onClick={handleLeave}
          style={btnStyle(false, "danger")}
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Right items - Sidebar Toggles & Fullscreen */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "250px", justifyContent: "flex-end" }}>
        
        <button 
          title="Toggle Participants"
          onClick={() => setActivePanel(activePanel === "participants" ? "closed" : "participants")}
          style={btnStyle(activePanel === "participants")}
        >
          <Users size={18} />
        </button>

        <button 
          title="Toggle Chat"
          onClick={() => setActivePanel(activePanel === "chat" ? "closed" : "chat")}
          style={btnStyle(activePanel === "chat")}
        >
          <MessageSquare size={18} />
        </button>

        <div style={{ width: "1px", height: "30px", background: "var(--dm-border)", margin: "0 4px" }} />

        <button 
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          onClick={toggleFullscreen}
          style={btnStyle(isFullscreen)}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>

      </div>
    </div>
  );
}
