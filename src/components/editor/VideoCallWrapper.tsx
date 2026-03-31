"use client";

import { useEffect, useState } from "react";
import {
  StreamVideo, StreamVideoClient, StreamCall, StreamTheme,
  PaginatedGridLayout, CallControls, User, CallingState, useCallStateHooks, Call
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Video, Loader2, VideoOff, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!;

export default function VideoCallWrapper({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Use real session user, fallback to localStorage anon id
  useEffect(() => {
    const sessionUser = session?.user as { _id?: string, id?: string, name?: string, image?: string } | undefined;
    let id = sessionUser?._id || sessionUser?.id;
    if (!id) {
      const localId = window.localStorage.getItem("stream_user_id");
      if (localId) {
        id = localId;
      } else {
        id = "anon_" + Math.random().toString(36).slice(2, 10);
        window.localStorage.setItem("stream_user_id", id);
      }
    }
    setUser({
      id,
      name: sessionUser?.name || id,
      image: sessionUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(sessionUser?.name || id)}&background=12141a&color=34d399`,
    } as User);
  }, [session]);

  // Fetch Stream token
  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/stream-video-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
      .then(r => r.json())
      .then(d => { if (d.token) setToken(d.token); else setError(d.error || "Failed to get video token"); })
      .catch(e => setError(e.message || "Failed to get token"));
  }, [user?.id]);

  // Initialize client
  useEffect(() => {
    if (!API_KEY || !user || !token) return;
    // @ts-expect-error Stream SDK has complex UserRequest overload types
    const c = new StreamVideoClient({ apiKey: API_KEY, user, token });
    setClient(c);
    return () => { c.disconnectUser(); setClient(null); };
  }, [user, token]);

  const connectCall = async () => {
    if (!client) { setError("Stream client not initialised."); return; }
    setIsConnecting(true); setError(null);
    try {
      const callInstance = client.call("default", roomId);
      await callInstance.join({ create: true });
      setCall(callInstance);
    } catch (e: unknown) {
      const err = e as Error;
      if (err.name === "NotAllowedError" || err.message?.includes("Permission denied"))
        setError("Camera/microphone access denied. Check browser permissions.");
      else if (err.message?.includes("could not start video source"))
        setError("Camera already in use by another app or tab.");
      else if (err.message?.includes("Invalid API key") || err.message?.includes("api_key"))
        setError("Stream SDK not configured. Add NEXT_PUBLIC_STREAM_VIDEO_API_KEY to .env.local.");
      else
        setError(err.message || "Failed to join call.");
    } finally { setIsConnecting(false); }
  };

  // ── UI states ──
  const panelStyle: React.CSSProperties = {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "20px", textAlign: "center", gap: "12px",
  };

  if (error) return (
    <div style={panelStyle}>
      <VideoOff style={{ width: "28px", height: "28px", color: "#f87171" }} />
      <p style={{ fontSize: "12px", fontWeight: 700, color: "#f87171", margin: 0 }}>Video Call Error</p>
      <p style={{ fontSize: "12px", color: "#78716c", margin: 0, lineHeight: 1.5 }}>{error}</p>
      <button onClick={() => { setError(null); connectCall(); }}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "7px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
        <RefreshCw style={{ width: "13px", height: "13px" }} /> Retry
      </button>
    </div>
  );

  if (!client) return (
    <div style={panelStyle}>
      <Loader2 style={{ width: "24px", height: "24px", color: "#34d399" }} className="animate-spin" />
      <p style={{ fontSize: "12px", color: "#78716c", margin: 0 }}>
        {!token ? "Fetching access token…" : "Initialising client…"}
      </p>
    </div>
  );

  if (!call) return (
    <div style={panelStyle}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Video style={{ width: "22px", height: "22px", color: "#34d399" }} />
      </div>
      <p style={{ fontSize: "13px", fontWeight: 700, color: "white", margin: 0 }}>Video Call</p>
      <p style={{ fontSize: "12px", color: "#78716c", margin: 0 }}>Join the video session with your team</p>
      <button onClick={connectCall} disabled={isConnecting}
        style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 20px", borderRadius: "8px", background: "#34d399", color: "#080a0f", fontWeight: 700, fontSize: "14px", border: "none", cursor: isConnecting ? "not-allowed" : "pointer", opacity: isConnecting ? 0.7 : 1, transition: "all 150ms" }}>
        {isConnecting
          ? <><Loader2 style={{ width: "14px", height: "14px" }} className="animate-spin" /> Connecting…</>
          : <><Video style={{ width: "14px", height: "14px" }} /> Connect Video</>
        }
      </button>
    </div>
  );

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme as="main" className="my-theme">
          <VideoCallUI onLeave={() => setCall(null)} />
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
}

function VideoCallUI({ onLeave }: { onLeave: () => void }) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onLeave();
    }
  }, [callingState, onLeave]);

  if (callingState !== CallingState.JOINED) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px" }}>
      <Loader2 style={{ width: "20px", height: "20px", color: "#34d399" }} className="animate-spin" />
      <p style={{ fontSize: "12px", color: "#78716c", margin: 0 }}>Joining call…</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, minHeight: 0, padding: "8px" }}>
        <PaginatedGridLayout />
      </div>
      <div style={{ borderTop: "1px solid var(--dm-border)", padding: "8px", display: "flex", justifyContent: "center" }}>
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
}
