"use client";
import { useRouter } from "next/navigation";
import { Avatars } from "@/components/editor/Avatars";
import { useState } from "react";
import { Copy, Check, LogOut, Share2, Users, Terminal } from "lucide-react";

export default function RoomHeader({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px", height: "52px", flexShrink: 0,
      background: "var(--dm-card)",
      borderBottom: "1px solid var(--dm-border)",
      gap: "16px",
    }}>
      {/* Left — Room info */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Terminal style={{ width: "14px", height: "14px", color: "#34d399" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "13px", color: "#34d399", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {roomId}
          </p>
          <p style={{ fontSize: "11px", color: "var(--dm-muted)", margin: 0 }}>Collaborative session · Active</p>
        </div>
        {/* Live pulsing dot */}
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", flexShrink: 0, boxShadow: "0 0 6px #34d399" }} className="animate-pulse" />
      </div>

      {/* Center — Avatars */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <Users style={{ width: "14px", height: "14px", color: "var(--dm-muted)" }} />
        <Avatars />
      </div>

      {/* Right — Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <button onClick={handleCopy}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "7px", background: copied ? "rgba(52,211,153,0.1)" : "var(--dm-input)", border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "var(--dm-border)"}`, color: copied ? "#34d399" : "var(--dm-muted)", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 200ms" }}>
          {copied ? <><Check style={{ width: "13px", height: "13px" }} /> Copied!</> : <><Share2 style={{ width: "13px", height: "13px" }} /> Share</>}
        </button>
        <button onClick={() => router.push("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "7px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all 200ms" }}>
          <LogOut style={{ width: "13px", height: "13px" }} /> Leave
        </button>
      </div>
    </div>
  );
}