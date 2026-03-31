"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Zap, Terminal, Users, Globe, Play,
  ArrowRight, Video, MessageSquare, CheckCircle
} from "lucide-react";

const features = [
  {
    icon: Terminal,
    title: "Real-Time Code Editor",
    desc: "Monaco-powered collaborative editor with syntax highlighting for 10+ languages. Changes sync instantly across all participants."
  },
  {
    icon: Play,
    title: "Live Code Execution",
    desc: "Run JavaScript, TypeScript, and Python directly in the browser. See output in real-time without any local setup."
  },
  {
    icon: Users,
    title: "Multiplayer Presence",
    desc: "See exactly where your teammates are with live cursors, selections, and avatars powered by Liveblocks."
  },
  {
    icon: Video,
    title: "Video Rooms",
    desc: "Built-in video and audio via Stream SDK. Jump on a call without leaving your coding session."
  },
  {
    icon: Globe,
    title: "Public & Private Rooms",
    desc: "Create public rooms for open collaboration or private invite-only rooms for your team."
  },
  {
    icon: MessageSquare,
    title: "Integrated Chat",
    desc: "Real-time messaging alongside your code. No need to switch to a separate app."
  },
];

const faqs = [
  { q: "Is DevMeet free to use?", a: "Yes — DevMeet is completely free during our beta. Create unlimited rooms and invite your team." },
  { q: "Do I need to install anything?", a: "No installations required. DevMeet runs entirely in the browser. Just sign up and start coding." },
  { q: "How many people can join a room?", a: "Up to 4 by default, with up to 10 supported in advanced room settings." },
  { q: "What languages are supported?", a: "JavaScript, TypeScript, Python, Java, C++, HTML/CSS, SQL, Markdown, and more via the Monaco editor." },
  { q: "Is my code private?", a: "Room sessions are ephemeral — code is not permanently stored. Private rooms require an invite link." },
  { q: "Can I delete rooms I created?", a: "Yes. Go to Dashboard → My Rooms and click Delete on any room you own." },
];

export default function Page() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return <div style={{ minHeight: "100vh", background: "#080a0f" }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "white", width: "100%" }}>

      {/* ── Hero ── */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "88vh", padding: "0 24px", position: "relative" }}>
        {/* Glow */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "400px", background: "rgba(52,211,153,0.06)", filter: "blur(100px)", borderRadius: "50%", pointerEvents: "none" }} />

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "20px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", marginBottom: "32px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#34d399", letterSpacing: "0.02em" }}>
            DevMeet v2.0 is live
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-2px", margin: "0 0 24px", maxWidth: "900px" }}>
          Code together.{" "}
          <span style={{ background: "linear-gradient(135deg, #34d399, #059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Build faster.
          </span>
        </h1>

        {/* Subheading */}
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#78716c", fontWeight: 500, maxWidth: "620px", lineHeight: 1.7, margin: "0 0 48px" }}>
          The ultimate real-time collaboration environment for developers. Share code, pair program, and seamlessly communicate — all in one place.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/sign-up"
            style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 32px", borderRadius: "10px", background: "#34d399", color: "#080a0f", fontWeight: 800, fontSize: "16px", textDecoration: "none", transition: "filter 150ms" }}>
            <Zap style={{ width: "18px", height: "18px" }} />
            Start Coding Now
          </Link>
          <Link href="#features"
            style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 32px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", color: "white", fontWeight: 700, fontSize: "16px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.07)", transition: "background 150ms" }}>
            See Features <ArrowRight style={{ width: "16px", height: "16px" }} />
          </Link>
        </div>

        {/* Social proof */}
        <p style={{ fontSize: "13px", color: "#78716c", marginTop: "32px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle style={{ width: "14px", height: "14px", color: "#34d399" }} />
          Free to use · No credit card · Start in seconds
        </p>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "96px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1px" }}>
              Everything you need to <span style={{ color: "#34d399" }}>ship faster</span>
            </h2>
            <p style={{ color: "#78716c", fontSize: "16px", maxWidth: "500px", margin: "0 auto" }}>
              A purpose-built environment for developer collaboration — no compromises.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "24px", transition: "border-color 200ms" }}
                className="room-card-hover">
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <f.icon style={{ width: "20px", height: "20px", color: "#34d399" }} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: "16px", margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ color: "#78716c", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: "0 24px 96px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: "16px", padding: "56px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(52,211,153,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.5px", position: "relative" }}>
            Ready to code smarter?
          </h2>
          <p style={{ color: "#78716c", fontSize: "16px", margin: "0 0 32px", position: "relative" }}>
            Join DevMeet and start collaborating with your team in under 60 seconds.
          </p>
          <Link href="/sign-up"
            style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 36px", borderRadius: "10px", background: "#34d399", color: "#080a0f", fontWeight: 800, fontSize: "16px", textDecoration: "none", position: "relative" }}>
            Get started free <ArrowRight style={{ width: "17px", height: "17px" }} />
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "96px 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
              Frequently Asked <span style={{ color: "#34d399" }}>Questions</span>
            </h2>
            <p style={{ color: "#78716c", fontSize: "16px" }}>Everything you need to know about DevMeet.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "20px 24px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "15px", color: "#34d399", margin: "0 0 8px" }}>{faq.q}</h3>
                <p style={{ color: "#78716c", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}