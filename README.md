# DevMeet - Real-Time Collaborative Coding Platform

This document explains **everything** about DevMeet — from the basic concepts behind real-time collaboration to the complete system architecture. After reading this, you should understand exactly how data flows through the system without needing to read the code.

---

## Table of Contents

1. [What is DevMeet?](#1-what-is-devmeet)
2. [Background Concepts](#2-background-concepts)
3. [Project Overview](#3-project-overview)
4. [File Structure](#4-file-structure)
5. [The User Journey: Step by Step](#5-the-user-journey-step-by-step)
6. [Deep Dive: Authentication System](#6-deep-dive-authentication-system)
7. [Deep Dive: Real-Time Collaborative Editor](#7-deep-dive-real-time-collaborative-editor)
8. [Deep Dive: Video Conferencing](#8-deep-dive-video-conferencing)
9. [Deep Dive: Code Execution](#9-deep-dive-code-execution)
10. [Security Architecture](#10-security-architecture)
11. [Building and Running](#11-building-and-running)
12. [Understanding the Tech Stack](#12-understanding-the-tech-stack)

---

## 1. What is DevMeet?

**DevMeet** is a browser-based collaborative space where friends and small teams can jump on a video call and write code together in real time — no setup, no plugins, no screen sharing hacks.

### Real-World Use Cases:
- **Group Study Sessions**: Friends preparing for coding interviews can write, run, and debug code together while on a call.
- **Virtual Technical Interviews**: Interviewers can observe candidates' live typing, thought process, and code output in one place.
- **Lightweight Team Collaboration**: Small teams can review code or pair program without needing heavy tools like Zoom + VS Code Live Share.

### What the Problem Was:

```
Without DevMeet (Old Way):
┌─────────────────────────────────────────────────────────┐
│   Zoom         +    VS Code Live Share   +    Slack     │
│  (Video Call)       (Code Sync)            (Chat)       │
│                                                         │
│   → 3 separate tools, 3 logins, context switching      │
│   → Screen share lag, no shared code execution         │
│   → Painful and slow to set up                         │
└─────────────────────────────────────────────────────────┘

With DevMeet (New Way):
┌─────────────────────────────────────────────────────────┐
│                Single Browser Tab                       │
│  ┌─────────────────────┐  ┌────────────────────────┐   │
│  │  Shared Code Editor │  │   Live Video Grid      │   │
│  │  (Yjs + CodeMirror) │  │   (Stream WebRTC)      │   │
│  └─────────────────────┘  └────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Code Output + Chat + Participant List          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Background Concepts

Before explaining how DevMeet works, it helps to understand a few key concepts it relies on.

### WebSockets vs HTTP

Most of the web runs on **HTTP**, which is a one-way request-response cycle:

```
HTTP (Traditional):
Browser ──── "Give me the page" ────► Server
Browser ◄─── "Here is the page" ───── Server
(Connection closes)

WebSocket (Real-Time):
Browser ◄══════════════════════════► Server
         (Persistent two-way tunnel)
         "User A typed 'H'"  ──────►
        ◄────  "User B typed 'e'"
         "User A moved cursor" ───►
         (Stays open forever)
```

**Why does this matter for DevMeet?** The collaborative editor needs every single keystroke to be pushed to all connected users *instantly*. HTTP is too slow for this. DevMeet uses **Liveblocks WebSocket servers** as the persistent tunnel for text syncing.

---

### What is a CRDT?

**CRDT (Conflict-free Replicated Data Type)** is the algorithm that handles what happens when two people type on the **same line at the same time**.

Imagine User A and User B both editing the word `"hello"`:

```
User A types "X" after "hell":     hell[X]o
User B types "Y" after "hell":     hell[Y]o

Network sends these changes simultaneously.

Without CRDT (bad):
  One operation overwrites the other → "hellXo" or "hellYo" (someone's work is lost)

With CRDT (how Yjs works):
  Each character has a unique ID + timestamp
  Both changes can coexist deterministically → "hellXYo" or "hellYXo"
  All clients reach the same final state, always.
```

DevMeet uses **Yjs**, the most popular CRDT library, to power this.

---

### What is WebRTC?

**WebRTC (Web Real-Time Communication)** is the browser technology that allows video/audio to stream directly between clients.

```
Without WebRTC (old way):
Browser ──► Upload video to Server ──► Server streams to others
              (High latency, high cost)

With WebRTC (DevMeet way):
Browser ──► SFU Server ──► Routes video to everyone
              (Low latency, efficient)
```

An **SFU (Selective Forwarding Unit)** is the key. Instead of a peer-to-peer mesh (where with 5 people, each uploads 4 separate video streams), the SFU receives each stream *once* and routes it efficiently.

```
Peer-to-Peer Mesh (BAD for 5 users):
User A ──► B, C, D, E   (4 uploads)
User B ──► A, C, D, E   (4 uploads)
              ↓
        20 total streams = your internet crashes

SFU (GOOD for 5 users):
User A ──► SFU ──► B, C, D, E   (1 upload)
User B ──► SFU ──► A, C, D, E   (1 upload)
              ↓
        5 total uploads = bandwidth stays fine
```

DevMeet uses **Stream's SFU servers** for this.

---

### What is JWT?

**JWT (JSON Web Token)** is how DevMeet knows who you are without checking the database on every request.

```
A JWT looks like this (3 parts separated by dots):
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMiLCJuYW1lIjoiQWRpdHlhIn0.SIGNATURE

Part 1: Header       → Algorithm used (HS256)
Part 2: Payload      → { userId: "123", name: "Aditya" }
Part 3: Signature    → Cryptographic proof it wasn't tampered with

Flow:
1. You log in → Server verifies password → Signs a JWT with its secret key
2. JWT stored in your browser cookie
3. Every future request → JWT sent automatically
4. Server verifies signature → Knows who you are instantly (no DB needed)
```

---

## 3. Project Overview

### What DevMeet Does

```
                      ┌─────────────────────────────────┐
                      │          VERCEL (Cloud)          │
                      │                                  │
  User Opens App ───► │  Next.js (Frontend + API)        │
                      │      │           │               │
                      │      ▼           ▼               │
                      │  MongoDB     Auth (JWT)          │
                      └──────┬───────────┬───────────────┘
                             │           │
                   ┌─────────┘           └──────────┐
                   ▼                                ▼
        ┌──────────────────┐            ┌──────────────────┐
        │  Liveblocks      │            │  Stream Video    │
        │  (WebSocket +    │            │  (WebRTC + SFU   │
        │   Yjs CRDT)      │            │   Video/Audio)   │
        └──────────────────┘            └──────────────────┘
         Real-time Code Sync             Video Conferencing
```

### Two Core Flows

| Flow | Description | Key Technologies |
|------|-------------|-----------------|
| Code Collaboration | Keystrokes are synced in real-time between all users in a room | Yjs (CRDT), CodeMirror 6, Liveblocks WebSockets |
| Video Conferencing | Live camera/mic is captured and routed to all participants | Stream Video SDK, WebRTC, SFU |

---

## 4. File Structure

```
devmeet/
├── src/
│   ├── app/                        # Next.js 15 App Router
│   │   ├── (auth)/                 # Auth routes
│   │   │   ├── sign-in/            # Login page
│   │   │   ├── sign-up/            # Registration page
│   │   │   └── verify/             # OTP verification page
│   │   │
│   │   ├── api/                    # Backend API layer (Serverless Functions)
│   │   │   ├── auth/[...nextauth]/ # NextAuth.js handler
│   │   │   ├── signup/             # User registration endpoint
│   │   │   ├── room/               # Room CRUD operations
│   │   │   ├── liveblocks-auth/    # Signs Liveblocks access tokens
│   │   │   ├── stream-video-token/ # Signs Stream JWT access tokens
│   │   │   └── execute/            # Code execution proxy → Piston API
│   │   │
│   │   ├── dashboard/              # User control center (post-login)
│   │   └── room/[roomId]/          # Dynamic room page (collaboration)
│   │
│   ├── components/
│   │   ├── editor/
│   │   │   ├── CollaborativeEditor.tsx  # CodeMirror + Yjs integration
│   │   │   ├── Cursors.tsx              # Live cursor rendering
│   │   │   └── VideoCallWrapper.tsx     # Stream video grid component
│   │   └── roomsturuture/
│   │       ├── StreamRoomProvider.tsx   # Stream SDK context setup
│   │       ├── BottomBar.tsx            # Room control buttons
│   │       └── ParticipantsPanel.tsx    # Participant list panel
│   │
│   ├── models/                     # Mongoose DB schemas
│   │   ├── User.ts                 # User document schema
│   │   ├── Room.ts                 # Room document schema
│   │   ├── Friendship.ts           # Friend relationship schema
│   │   └── Event.ts                # Event listing schema
│   │
│   ├── lib/
│   │   └── dbConnect.ts            # ★ Global connection cache ★
│   │
│   ├── helpers/                    # Utility functions (OTP, email dispatch)
│   ├── liveblocks.config.ts        # Liveblocks type configuration
│   └── middleware.ts               # ★ Edge auth guards & security headers ★
│
├── .env.local                      # Secret API keys (never commit this)
├── next.config.ts                  # Next.js & CSP configuration
└── README.md                       # This file!
```

---

## 5. The User Journey: Step by Step

Let's trace a user from opening the browser to collaborating inside a room.

### Step 1: Landing Page

User opens `devmeet.vercel.app`. Next.js renders a static landing page (a Server Component — no JavaScript sent to browser for this part).

### Step 2: Sign Up

User clicks "Sign Up" and submits their email and password.

```
Browser                     Next.js API (/api/signup)         MongoDB
   │                               │                              │
   │── POST { email, password } ──►│                              │
   │                               │── Zod validates payload ───► │ (schema check)
   │                               │── bcrypt.hash(password, 12) │
   │                               │── Save new User to DB ──────►│
   │                               │── Resend API: Send OTP email │
   │◄── { success: true } ─────────│                              │
   │                               │                              │
   (Redirected to /verify page)
```

### Step 3: OTP Verification

```
User's Email Inbox → User types OTP → POST /api/verify-otp → DB checks OTP validity
                                                            → Marks account as verified
```

### Step 4: Login & Session

```
Browser                     NextAuth.js                      MongoDB
   │                               │                              │
   │── POST { email, password } ──►│                              │
   │                               │── Find user in DB ──────────►│
   │                               │◄── { hashedPassword } ───────│
   │                               │── bcrypt.compare(input, hash)│
   │                               │── Signs JWT:                 │
   │                               │   { userId, name, avatar }   │
   │◄── Set-Cookie: session-token ─│                              │
   │    (HTTP-only, Secure)        │                              │
   (Redirected to /dashboard)
```

**Key Point:** From this point forward, every request includes the JWT cookie automatically. The server never needs to query the DB to know who you are — it just reads and verifies the JWT signature.

### Step 5: Creating a Room

```
Dashboard → Click "Create Room" → POST /api/room → DB saves Room document
                                                  → Returns { roomId: "abc-123" }
                                                  → User is redirected to /room/abc-123
```

### Step 6: Edge Middleware Guard

When *anyone* navigates to `/room/abc-123`, the request hits **Edge Middleware first**:

```
Request to /room/abc-123
        │
        ▼
┌───────────────────────────┐
│     middleware.ts         │
│  (Runs at CDN Edge)       │
│                           │
│  JWT cookie present? ─No─►  Redirect to /sign-in
│         │                 │
│        Yes                │
│         │                 │
│  JWT signature valid? ─No─►  Redirect to /sign-in
│         │                 │
│        Yes                │
│         ▼                 │
│  Allow request through    │
└───────────────────────────┘
        │
        ▼
 Room page renders
```

### Step 7: Pre-Join Lobby

Before entering the live room, the user hits the lobby page. Stream SDK hooks (`useCallStateHooks`) access the camera and microphone so the user can test hardware before joining the call.

### Step 8: Entering the Room — Token Provisioning

Before the frontend can connect to Liveblocks (for text sync) or Stream (for video), it needs access tokens signed by the backend. This is the **Token Provider Pattern**:

```
Browser                  Next.js API                   External Service
   │                          │                               │
   │── GET /api/liveblocks-auth ──►│                          │
   │                          │── Verify JWT session          │
   │                          │── Check user is in room       │
   │                          │── Sign Liveblocks access token│
   │◄── { token: "lb_..." } ──│                               │
   │                          │                               │
   │── Connect to Liveblocks ──────────────────────────────►  │
   │   (using temp token)                                      │
   │◄──────────── WebSocket connection opened ─────────────── │
   │                                                           │
   │                                                           │
   │── GET /api/stream-video-token ──►│                        │
   │                          │── Sign Stream JWT token       │
   │◄── { token: "st_..." } ──│                               │
   │                          │                               │
   │── Connect to Stream SFU ──────────────────────────────► │
   │◄──────────── WebRTC connection established ───────────── │
```

**Why not just put the Liveblocks/Stream secret keys in the frontend directly?**
> Because React code is public — anyone can open DevTools and extract your keys. The Token Provider pattern ensures the master secrets *never leave the server*.

---

## 6. Deep Dive: Authentication System

### The Three Login Paths

| Method | Flow | Key Tech |
|--------|------|----------|
| Google OAuth | Click "Login with Google" → Google redirects back with user info | NextAuth Google Provider |
| GitHub OAuth | Click "Login with GitHub" → GitHub redirects back with user info | NextAuth GitHub Provider |
| Email + Password | Submit form → OTP verification → bcrypt password check | NextAuth Credentials + Resend |

### Session Strategy: JWT vs Database Sessions

DevMeet uses **JWT sessions**, not database sessions. Here's why:

```
Database Session (Not Used):
  Login → Create session row in DB → Store session ID in cookie
  Every request → Cookie sent → DB lookup for session row → Verify
  Problem: DB query on EVERY request. Slow and expensive at scale.

JWT Session (Used in DevMeet):
  Login → Sign JWT with secret key → Store JWT in cookie
  Every request → Cookie sent → Verify signature locally (no DB!)
  Advantage: Zero database reads for auth verification.
```

### bcrypt: Why 12 Rounds?

```
bcrypt takes your password and runs it through a hashing algorithm N times:
  - 1 round  = instant (too fast, easy to brute force)
  - 10 rounds = ~100ms  (good)
  - 12 rounds = ~400ms  (used in DevMeet, industry standard)
  - 14 rounds = ~1.5 sec (overkill for web app)

The "salt" added before hashing means even two users with
the password "abc123" will have completely different hashes in the DB.
```

---

## 7. Deep Dive: Real-Time Collaborative Editor

This is the most technically complex part of the system.

### The Components

```
CodeMirror 6        Yjs                  Liveblocks
(The text editor)   (The CRDT engine)    (The network)
      │                   │                   │
      │◄── User types ────┤                   │
      │                   │── Generate CRDT   │
      │                   │   update packet   │
      │                   │──────────────────►│
      │                   │                   │── Broadcasts to
      │                   │                   │   all other clients
      │                   │◄──────────────────│
      │                   │── Apply CRDT      │
      │◄── Update view ───│   merge math      │
```

### How Conflict Resolution Works (CRDT Deep Dive)

Yjs does not store the document as a plain string. It stores it as a **linked list of items**, where each item (character or block) has:

```
Each character in Yjs:
┌──────────────────────────────────────────────────────────┐
│  ID: { clientID: 42, clock: 17 }  ← Unique identifier   │
│  Content: "H"                     ← The actual character │
│  Origin: { clientID: 42, clock: 16 }  ← Left neighbor   │
│  Right Origin: { clientID: 0, clock: 0 } ← Right neighbor│
└──────────────────────────────────────────────────────────┘
```

When two users insert at the same position simultaneously, Yjs uses the `clientID` to deterministically decide the order — no server coordination required.

### How Cursors Work (Liveblocks Presence)

Live cursor positions are **not** part of the Yjs document. They are broadcasted separately via Liveblocks **Presence**:

```typescript
// Each client constantly broadcasts their cursor position
updateMyPresence({
  cursor: { x: event.clientX, y: event.clientY },
  color: "#FF5733",
  name: "Aditya"
});

// Other clients receive this and render a colored cursor tag
const others = useOthers(); // Array of all other users' presence data
```

---

## 8. Deep Dive: Video Conferencing

### The WebRTC Signaling Flow

Before two people can exchange video, their browsers need to negotiate connection details (IPs, codecs, etc.). This is called **signaling**:

```
Browser A             Stream Signaling Server          Browser B
    │                          │                           │
    │── "I want to connect" ──►│                           │
    │── SDP Offer ────────────►│──── SDP Offer ───────────►│
    │                          │◄─── SDP Answer ───────────│
    │◄── SDP Answer ───────────│                           │
    │── ICE Candidates ───────►│──── ICE Candidates ──────►│
    │◄── ICE Candidates ───────│◄─── ICE Candidates ───────│
    │                          │                           │
    │◄═════════ Direct Video/Audio via UDP ════════════════►│
    │              (Now bypasses the server)               │
```

**SDP** = Session Description Protocol (describes what codecs the browser supports)
**ICE** = Interactive Connectivity Establishment (discovers public IPs through firewalls)

### Pre-Join Lobby: Why It Exists

Before entering the call, the Pre-Join Lobby runs these checks using Stream hooks:

```
┌──────────────────────────────────────────────────┐
│                 Pre-Join Lobby                   │
│                                                  │
│  ┌─────────────────┐   ┌─────────────────────┐  │
│  │  Camera Preview │   │   Hardware Toggles  │  │
│  │  (Your face)    │   │   🎥 Camera  ON/OFF │  │
│  └─────────────────┘   │   🎤 Mic     ON/OFF │  │
│                        └─────────────────────┘  │
│                                                  │
│    [ Join Room ]                                 │
└──────────────────────────────────────────────────┘
  (User officially subscribes to WebRTC call only after clicking "Join Room")
```

---

## 9. Deep Dive: Code Execution

### The Problem: Remote Code Execution (RCE)

If DevMeet ran user code directly on its Vercel servers:

```
User writes: process.exit(1)  → Kills the server
User writes: rm -rf /         → Deletes all server files
User writes: while(true){}    → Infinite loop, crashes server

This is called Remote Code Execution (RCE) — a catastrophic vulnerability.
```

### The Solution: Server Proxy Pattern

```
Browser              Next.js API              Piston API (Docker)
   │                     │                           │
   │── POST {            │                           │
   │    code: "...",     │                           │
   │    language: "js"   │                           │
   │   } ───────────────►│                           │
   │                     │── Validates payload       │
   │                     │── Attaches API key        │
   │                     │── POST to Piston ────────►│
   │                     │                           │── Spins up Docker container
   │                     │                           │── Runs code in isolation
   │                     │                           │── 5-second timeout enforced
   │                     │                           │── No network access inside
   │                     │◄── { stdout, stderr } ────│── Destroys container
   │◄── { output } ──────│                           │
```

**Why proxy through Next.js instead of calling Piston directly from the browser?**
1. API keys stay hidden on the server (never exposed in browser).
2. Rate limiting can be enforced per user.
3. Input can be validated/sanitized before reaching the sandbox.

---

## 10. Security Architecture

DevMeet implements security at every layer:

```
Layer 1: Edge (CDN)
  └── middleware.ts → JWT validation, auth guards, CSP headers

Layer 2: API Input (Backend)
  └── Zod runtime schema validation on every API route

Layer 3: Password Storage (Database)
  └── bcryptjs with 12 salt rounds — passwords never stored as plain text

Layer 4: Session Management
  └── HTTP-only JWT cookies — inaccessible to JavaScript (prevents XSS theft)

Layer 5: Third-Party Access (BaaS)
  └── Token Provider Pattern — master keys never sent to frontend

Layer 6: Code Execution (Sandbox)
  └── All user code runs in isolated Docker containers via Piston API
  └── Zero network access, strict CPU/memory limits, containers destroyed after use

Layer 7: Account Creation
  └── OTP verification via Resend — prevents spam and bot accounts
```

---

## 11. Building and Running

### Prerequisites

- **Node.js 18.x** or higher
- **MongoDB Atlas** account (or local instance)
- **Liveblocks** account → [liveblocks.io](https://liveblocks.io)
- **Stream** account → [getstream.io](https://getstream.io)
- **Resend** account → [resend.com](https://resend.com)

### 1. Installation

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory. **Never commit this file.**

```env
# ── Database ──────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<AppName>

# ── NextAuth (Session Management) ─────────────────────────────────
NEXTAUTH_SECRET=generate_a_long_random_string_here
NEXTAUTH_URL=http://localhost:3000

# ── Liveblocks (Collaborative Editor WebSockets) ──────────────────
LIVEBLOCKS_SECRET_KEY=sk_prod_...

# ── Stream (Video Conferencing WebRTC) ────────────────────────────
NEXT_PUBLIC_STREAM_VIDEO_API_KEY=your_public_key    # Safe to expose (public)
STREAM_VIDEO_API_KEY=your_stream_api_key            # Keep secret!
STREAM_VIDEO_API_SECRET=your_secret_stream_key      # Keep secret!
STREAM_API_SECRET=your_secret_stream_key            # Keep secret!

# ── Email Delivery (OTP Verification) ─────────────────────────────
RESEND_API_KEY=re_...

# ── OAuth Providers ───────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`. The app uses **Turbopack** (Rust-based bundler) for fast hot-reloads.

### 4. Production Build

```bash
npm run build
npm run start
```

---

## 12. Understanding the Tech Stack

| Category | Tool | Why This One? | Alternative Considered |
|----------|------|---------------|----------------------|
| Framework | Next.js 15 | Unified frontend + API, no CORS issues | Vite + Express.js (separate repos) |
| Real-time Sync | Liveblocks | Managed WebSockets, Yjs integration | Socket.io on custom server |
| CRDT Engine | Yjs | Fastest CRDT library, CodeMirror plugin exists | Automerge, ShareDB |
| Code Editor | CodeMirror 6 | Modular, accessible, first-class Yjs support | Monaco Editor (heavy) |
| Video SDK | Stream Video | Best React DX, handles WebRTC complexity | Twilio, Agora, raw WebRTC |
| Authentication | NextAuth.js | Native Next.js integration, multi-provider | Clerk, Firebase Auth |
| Password Hashing | bcrypt.js | Pure JS, works in serverless (unlike native bcrypt) | Argon2 (hard to compile in Vercel) |
| Database | MongoDB + Mongoose | Flexible schema, easy TypeScript types | PostgreSQL + Prisma |
| Validation | Zod | TypeScript-native, runtime safety | Yup, Joi |
| Email | Resend + React Email | Best DX for transactional emails | Nodemailer, SendGrid |
| Hosting | Vercel | Zero-config Next.js deployment | AWS, Railway |

---

## Summary

DevMeet demonstrates:

1. **Stateless Serverless Architecture** — JWT sessions, connection caching, edge middleware
2. **Real-Time Collaboration** — CRDT-based text merging via Yjs and Liveblocks WebSockets
3. **WebRTC Video Conferencing** — Low-latency video via SFU architecture through Stream SDK
4. **Security-First Design** — Multi-layer protection from Edge to database
5. **Backend as a Service** — Strategically outsourcing WebSockets and WebRTC to managed services
6. **Safe Code Execution** — Server Proxy Pattern with containerized Docker sandboxing

The key insight behind DevMeet is that **modern real-time applications don't need custom server infrastructure** — by combining Next.js serverless functions with carefully chosen BaaS platforms (Liveblocks, Stream), you can deliver a full collaborative coding experience from a single, deployable repository.

---

## Questions?

The codebase is structured to mirror this document exactly. Start with `src/middleware.ts` to understand the security layer, then `src/lib/dbConnect.ts` for the database pattern, then `src/components/editor/CollaborativeEditor.tsx` for the real-time collaboration system.

Happy coding! 🚀
