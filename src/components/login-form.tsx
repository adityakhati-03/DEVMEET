"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";

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

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await signIn("credentials", { redirect: false, identifier: email, password });
    if (result?.error) setError("Invalid email or password. Please try again.");
    else { router.push("/dashboard"); router.refresh(); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "78vh", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Logo mark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Zap style={{ width: "22px", height: "22px", color: "#34d399" }} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--dm-text)", margin: 0 }}>Welcome back</h1>
          <p style={{ color: "var(--dm-muted)", fontSize: "14px", margin: "6px 0 0", fontWeight: 500 }}>
            Sign in to your DevMeet account
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--dm-card)", border: "1px solid var(--dm-border)", borderRadius: "12px", padding: "28px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email or Username</label>
              <input
                type="text" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required disabled={loading}
                autoComplete="email" style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: "12px", color: "#34d399", textDecoration: "none", fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  required disabled={loading} autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: "44px" }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--dm-muted)", padding: 0 }}>
                  {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "8px", background: "#34d399", color: "#080a0f", fontWeight: 800, fontSize: "15px", border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1, transition: "filter 150ms" }}>
              {loading ? <><Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" /> Signing in...</> : "Sign In"}
            </button>

            {/* Sign up link */}
            <p style={{ fontSize: "14px", color: "var(--dm-muted)", textAlign: "center", margin: 0 }}>
              Don't have an account?{" "}
              <Link href="/sign-up" style={{ color: "#34d399", fontWeight: 700, textDecoration: "none" }}>
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
