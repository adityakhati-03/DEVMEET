"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

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

export default function ResetPasswordPage() {
  // Step 1 = enter OTP, Step 2 = enter new password
  const [step, setStep]               = useState<1 | 2>(1);
  const [code, setCode]               = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  const router = useRouter();
  const params = useParams();
  const username = decodeURIComponent(params.username as string);

  // ── Step 1: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError("Enter the full 6-digit code."); return; }
    setError(""); setLoading(true);

    try {
      // We verify the OTP exists & matches before asking for new password
      // We do a lightweight check: just call reset-password with an intentionally
      // bad password format so it fails ONLY at password validation, confirming
      // the OTP is correct first.
      // Better UX: we just advance to step 2 and let the final API call do the work.
      // No round-trip needed — hold the code in state and submit together.
      setStep(2);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Submit new password with OTP ────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code, newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Password reset! Redirecting to sign in...");
        setTimeout(() => router.push("/sign-in"), 1800);
      } else {
        // If OTP was wrong, go back to step 1
        if (data.message?.toLowerCase().includes("code")) {
          setStep(1);
          setCode("");
        }
        setError(data.message || "Reset failed. Please try again.");
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
            <KeyRound style={{ width: "22px", height: "22px", color: "#34d399" }} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--dm-text)", margin: 0 }}>
            {step === 1 ? "Check your inbox" : "Set new password"}
          </h1>
          <p style={{ color: "var(--dm-muted)", fontSize: "14px", margin: "6px 0 0", fontWeight: 500, textAlign: "center", lineHeight: 1.5 }}>
            {step === 1
              ? <>We sent a 6-digit code to the email for <strong style={{ color: "var(--dm-text)" }}>@{username}</strong>.</>
              : "Choose a strong new password for your account."}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--dm-card)", border: "1px solid var(--dm-border)", borderRadius: "12px", padding: "28px" }}>

          {/* ── Step 1: OTP input ── */}
          {step === 1 && (
            <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Reset Code</label>
                <input
                  name="code" type="text" placeholder="123456" maxLength={6}
                  required disabled={loading}
                  value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                  style={{
                    ...inputStyle,
                    fontSize: "22px", fontWeight: 800,
                    letterSpacing: "0.45em", textAlign: "center",
                  }}
                />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || code.length < 6}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "8px", background: "#34d399", color: "#080a0f", fontWeight: 800, fontSize: "15px", border: "none", cursor: (loading || code.length < 6) ? "not-allowed" : "pointer", opacity: (loading || code.length < 6) ? 0.5 : 1, transition: "opacity 150ms" }}>
                {loading ? <><Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" />Verifying...</> : "Continue"}
              </button>

              <p style={{ fontSize: "14px", color: "var(--dm-muted)", textAlign: "center", margin: 0 }}>
                Didn't get the code?{" "}
                <Link href="/forgot-password" style={{ color: "#34d399", fontWeight: 700, textDecoration: "none" }}>
                  Send again
                </Link>
              </p>
            </form>
          )}

          {/* ── Step 2: New password ── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••" required disabled={loading}
                    style={{ ...inputStyle, paddingRight: "44px" }}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--dm-muted)", padding: 0 }}>
                    {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                  </button>
                </div>
                <p style={{ fontSize: "12px", color: "var(--dm-muted)", marginTop: "6px" }}>
                  Min 8 characters with uppercase, lowercase, number &amp; special character
                </p>
              </div>

              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" required disabled={loading}
                  style={inputStyle}
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
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "8px", background: "#34d399", color: "#080a0f", fontWeight: 800, fontSize: "15px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 150ms" }}>
                {loading ? <><Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" />Resetting...</> : "Reset Password"}
              </button>

              <button type="button" onClick={() => { setStep(1); setError(""); }}
                style={{ background: "none", border: "none", color: "var(--dm-muted)", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>
                ← Back to code entry
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
