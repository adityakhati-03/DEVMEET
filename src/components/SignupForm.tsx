"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";

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

// ─── Field lives OUTSIDE SignUpForm so it never gets recreated on state change ───
interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  hint?: string;
  value: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  fieldError?: string;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  id, label, type = "text", placeholder, hint,
  value, showPassword, onTogglePassword, fieldError, loading, onChange,
}: FieldProps) {
  const isPassword = id === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={id}
          type={resolvedType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          disabled={loading}
          style={{ ...inputStyle, ...(isPassword ? { paddingRight: "44px" } : {}) }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            style={{
              position: "absolute", right: "12px", top: "50%",
              transform: "translateY(-50%)", background: "none",
              border: "none", cursor: "pointer", color: "var(--dm-muted)", padding: 0,
            }}
          >
            {showPassword
              ? <EyeOff style={{ width: "16px", height: "16px" }} />
              : <Eye style={{ width: "16px", height: "16px" }} />}
          </button>
        )}
      </div>
      {fieldError ? (
        <p style={{ fontSize: "12px", color: "#f87171", marginTop: "6px" }}>{fieldError}</p>
      ) : hint ? (
        <p style={{ fontSize: "12px", color: "var(--dm-muted)", marginTop: "6px" }}>{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Main form ───────────────────────────────────────────────────────────────
export function SignUpForm() {
  const [form, setForm]               = useState({ name: "", email: "", username: "", password: "" });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setFieldErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setFieldErrors({});
    try {
      const res  = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setError("Account created! Redirecting to verification...");
        setTimeout(() => router.push(`/verify/${data.user.username}`), 1000);
      } else {
        if (data.details) {
          const fe: Record<string, string> = {};
          data.details.forEach((err: { path?: string[]; message?: string }) => { if (err.path?.[0] && err.message) fe[err.path[0]] = err.message; });
          setFieldErrors(fe);
          setError("Please fix the errors below.");
        } else {
          setError(data.error || "Something went wrong.");
        }
      }
    } catch { setError("Signup failed. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "78vh", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>

        {/* Logo mark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Zap style={{ width: "22px", height: "22px", color: "#34d399" }} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--dm-text)", margin: 0 }}>Create your account</h1>
          <p style={{ color: "var(--dm-muted)", fontSize: "14px", margin: "6px 0 0", fontWeight: 500 }}>
            Join DevMeet and start coding together
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--dm-card)", border: "1px solid var(--dm-border)", borderRadius: "12px", padding: "28px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Field id="name"     label="Full Name" placeholder="Jane Doe"
                value={form.name}     loading={loading} onChange={handleChange} fieldError={fieldErrors.name} />
              <Field id="username" label="Username"  placeholder="janedoe"
                value={form.username} loading={loading} onChange={handleChange} fieldError={fieldErrors.username} />
            </div>

            <Field id="email"    label="Email"    type="email" placeholder="you@example.com"
              value={form.email}    loading={loading} onChange={handleChange} fieldError={fieldErrors.email} />

            <Field id="password" label="Password" placeholder="••••••••"
              value={form.password} loading={loading} onChange={handleChange} fieldError={fieldErrors.password}
              showPassword={showPassword} onTogglePassword={() => setShowPassword(v => !v)}
              hint="Min 8 characters with uppercase, lowercase, number & special character" />

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "8px", background: "#34d399", color: "#080a0f", fontWeight: 800, fontSize: "15px", border: "none", cursor: "pointer", opacity: loading ? 0.7 : 1, transition: "filter 150ms", marginTop: "4px" }}>
              {loading
                ? <><Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" />Creating account...</>
                : "Create Account"}
            </button>

            <p style={{ fontSize: "14px", color: "var(--dm-muted)", textAlign: "center", margin: 0 }}>
              Already have an account?{" "}
              <Link href="/sign-in" style={{ color: "#34d399", fontWeight: 700, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--dm-border)" }} />
            <span style={{ fontSize: "12px", color: "var(--dm-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "var(--dm-border)" }} />
          </div>

          {/* Google Sign-Up */}
          <div style={{ marginTop: "16px" }}>
            <SocialLoginButtons callbackUrl="/dashboard" />
          </div>
        </div>
      </div>
    </div>
  );
}
