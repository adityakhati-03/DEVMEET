"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--dm-input)", border: "1px solid var(--dm-border)",
  borderRadius: "8px", padding: "11px 14px", fontSize: "14px",
  color: "var(--dm-text)", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700,
  color: "var(--dm-muted)", textTransform: "uppercase",
  letterSpacing: "0.08em", marginBottom: "8px",
};

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    try {
      const res  = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Reset code sent! Check your inbox. Redirecting...");
        // Redirect to the reset page with the username returned by the API
        setTimeout(() => router.push(`/reset-password/${data.username}`), 1800);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100svh", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Logo mark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Mail style={{ width: "22px", height: "22px", color: "#34d399" }} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--dm-text)", margin: 0 }}>Forgot your password?</h1>
          <p style={{ color: "var(--dm-muted)", fontSize: "14px", margin: "6px 0 0", fontWeight: 500, textAlign: "center", lineHeight: 1.5 }}>
            Enter your email and we&apos;ll send you a reset code.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--dm-card)", border: "1px solid var(--dm-border)", borderRadius: "12px", padding: "28px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required disabled={loading}
                autoComplete="email" style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: "10px 14px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "8px", color: "#34d399", fontSize: "13px", fontWeight: 600 }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "8px", background: "#34d399", color: "#080a0f", fontWeight: 800, fontSize: "15px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "filter 150ms" }}>
              {loading ? <><Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" />Sending code...</> : "Send Reset Code"}
            </button>

            <p style={{ fontSize: "14px", color: "var(--dm-muted)", textAlign: "center", margin: 0 }}>
              Remembered it?{" "}
              <Link href="/sign-in" style={{ color: "#34d399", fontWeight: 700, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
