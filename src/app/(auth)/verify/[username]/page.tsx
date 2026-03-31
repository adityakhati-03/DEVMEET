"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";

export default function VerifyAccountPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const router = useRouter();
  const params = useParams();
  const username = decodeURIComponent(params.username as string);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg(data.message || "Account activated! Redirecting...");
        setTimeout(() => router.push("/sign-in"), 1500);
      } else {
        setError(data.message || data.error || "Incorrect verification code.");
      }
    } catch {
      setError("Network or API error checking verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        
        {/* Card Component */}
        <div style={{ background: "var(--dm-card)", border: "1px solid var(--dm-border)", borderRadius: "12px", padding: "32px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <MailCheck style={{ width: "22px", height: "22px", color: "#34d399" }} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--dm-text)", margin: 0, textAlign: "center" }}>Check your inbox</h1>
            <p style={{ color: "var(--dm-muted)", fontSize: "14px", margin: "6px 0 0", fontWeight: 500, textAlign: "center", lineHeight: 1.5 }}>
              We&apos;ve sent a 6-digit verification code to the email associated with <strong style={{color: "var(--dm-text)"}}>@{username}</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--dm-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                Verification Code
              </label>
              <input
                name="code" type="text" placeholder="123456" maxLength={6} required disabled={loading}
                value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: "100%", background: "var(--dm-input)", border: "1px solid var(--dm-border)",
                  borderRadius: "8px", padding: "14px", fontSize: "20px", fontWeight: 800,
                  letterSpacing: "0.5em", textAlign: "center",
                  color: "var(--dm-text)", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s"
                }}
                className="focus:border-emerald-500"
              />
            </div>

            {error && (
              <div style={{ padding: "12px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#f87171", fontSize: "13px", fontWeight: 500, textAlign: "center" }}>
                {error}
              </div>
            )}
            
            {successMsg && (
              <div style={{ padding: "12px 14px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "8px", color: "#34d399", fontSize: "13px", fontWeight: 600, textAlign: "center" }}>
                {successMsg}
              </div>
            )}

            <button type="submit" disabled={loading || code.length < 6}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "8px", background: "#34d399", color: "#080a0f", fontWeight: 800, fontSize: "15px", border: "none", cursor: (loading || code.length < 6) ? "not-allowed" : "pointer", opacity: (loading || code.length < 6) ? 0.5 : 1, transition: "opacity 150ms", marginTop: "4px" }}>
              {loading ? <><Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" /> Verifying...</> : "Verify Account"}
            </button>
            
          </form>
        </div>
        
      </div>
    </div>
  );
}
