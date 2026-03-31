"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Google colour logo SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.4 18.9 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.2C9.5 35.5 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C40.9 36.2 44 30.5 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

// GitHub monochrome logo SVG
function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

// Shared button style factory
const btnBase: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  gap: "10px", width: "100%", padding: "11px 16px",
  borderRadius: "8px",
  background: "var(--dm-input)",
  border: "1px solid var(--dm-border)",
  color: "var(--dm-text)", fontWeight: 600, fontSize: "14px",
  cursor: "pointer",
  transition: "border-color 150ms, background 150ms",
};

function OAuthButton({
  provider,
  label,
  icon,
  callbackUrl,
}: {
  provider: string;
  label: string;
  icon: React.ReactNode;
  callbackUrl: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await signIn(provider, { callbackUrl });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{ ...btnBase, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(52,211,153,0.4)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(52,211,153,0.04)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--dm-border)";
        (e.currentTarget as HTMLButtonElement).style.background = "var(--dm-input)";
      }}
    >
      {loading
        ? <Loader2 style={{ width: "18px", height: "18px" }} className="animate-spin" />
        : icon
      }
      {loading ? "Redirecting..." : label}
    </button>
  );
}

export function SocialLoginButtons({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <OAuthButton
        provider="google"
        label="Continue with Google"
        icon={<GoogleIcon />}
        callbackUrl={callbackUrl}
      />
      <OAuthButton
        provider="github"
        label="Continue with GitHub"
        icon={<GithubIcon />}
        callbackUrl={callbackUrl}
      />
    </div>
  );
}
