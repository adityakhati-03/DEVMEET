"use client";

import { useCallStateHooks, useCall } from "@stream-io/video-react-sdk";
import { Users, Mic, MicOff, Video, VideoOff, Shield } from "lucide-react";
import Image from 'next/image';

export function ParticipantsPanel() {
  const { useParticipants, useLocalParticipant, useMicrophoneState, useCameraState } = useCallStateHooks();
  const call = useCall();
  const rawParticipants = useParticipants();
  const localParticipant = useLocalParticipant();
  
  const { isMute: isLocalMicMute } = useMicrophoneState();
  const { isMute: isLocalCamMute } = useCameraState();
  
  const hostId = call?.state?.createdBy?.id;

  // Stream sometimes omits local user from generic list; guarantee inclusion
  const participants = [...rawParticipants];
  if (localParticipant && !participants.find((p) => p.sessionId === localParticipant.sessionId)) {
    participants.unshift(localParticipant);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--dm-surface)" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid var(--dm-border)", display: "flex", alignItems: "center", gap: "8px" }}>
        <Users style={{ width: "18px", height: "18px", color: "#34d399" }} />
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--dm-text)" }}>
          People ({participants.length})
        </h3>
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {participants.map((p) => {
          const isMicOn = p.isLocalParticipant 
            ? !isLocalMicMute 
            : p.publishedTracks.includes("audio" as unknown as typeof p.publishedTracks[0]);
            
          const isCamOn = p.isLocalParticipant 
            ? !isLocalCamMute 
            : p.publishedTracks.includes("video" as unknown as typeof p.publishedTracks[0]);

          return (
            <div key={p.sessionId} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", background: "var(--dm-card)", borderRadius: "8px", border: "1px solid var(--dm-border)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Image 
                  src={p.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || "U")}&background=E2E8F0&color=34d399`} 
                  alt={p.name} 
                  style={{ width: "32px", height: "32px", borderRadius: "16px", background: "var(--dm-bg)" }} 
                  width={32}
                  height={32}
                  unoptimized
                />
                <span style={{ fontSize: "13px", color: "var(--dm-text)", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                  {p.name || "Unknown"} {p.isLocalParticipant ? "(You)" : ""}
                  {p.userId === hostId && (
                    <span style={{ display: "flex", alignItems: "center", gap: "2px", background: "rgba(52,211,153,0.15)", color: "#34d399", padding: "2px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: 700, marginLeft: "4px" }}>
                      <Shield size={10} /> Host
                    </span>
                  )}
                </span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isMicOn ? <Mic size={14} color="#34d399" /> : <MicOff size={14} color="#ef4444" />}
                {isCamOn ? <Video size={14} color="#34d399" /> : <VideoOff size={14} color="#ef4444" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
