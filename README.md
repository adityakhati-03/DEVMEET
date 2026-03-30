# DevMeet 🚀

**DevMeet** is a high-performance, real-time collaboration environment designed for modern developer teams. It combines professional-grade coding tools with seamless communication to bridge the gap between building and talking.

---

## 🛠️ Exhaustive Tech Stack

### Framework & Language
- **Next.js 15**: Leveraging the **App Router**, **Server Actions**, and **Turbopack** for mission-critical performance.
- **TypeScript**: Full type safety across the entire stack, from API responses to state management.

### Real-Time & Collaboration
- **Liveblocks**: Powering multiplayer presence, live cursors, and state synchronization.
- **Yjs**: Ensuring conflict-free collaborative editing through Operational Transformation (OT) / CRDT logic via `@liveblocks/yjs`.
- **CodeMirror 6**: A modular, extensible code editor with syntax highlighting for 10+ languages (JS, TS, Python, Java, SQL, etc.).

### Communication Suite
- **GetStream.io SDK**:
  - **Stream Video/Audio**: Low-latency video rooms with host-only moderation and screen-sharing support.
  - **Stream Chat**: Integrated real-time messaging with rich-text support inside rooms.

### Authentication & Delivery
- **NextAuth.js**: Robust session management with the **Credentials Provider**.
- **bcryptjs**: Secure password hashing with industrial-standard salting.
- **Resend**: Transactional email delivery for OTP verification and password recovery.
- **React Email**: Beautifully designed, accessible email templates with `@react-email/components`.

### Database & Validation
- **MongoDB**: The primary document store for users, rooms, and community content.
- **Mongoose**: ODM tier with strictly typed schemas and population logic.
- **Zod**: Runtime schema validation for API requests and form submissions.

### UI / UX Architecture
- **Tailwind CSS 4**: Modern, performance-first utility styling.
- **Framer Motion & Motion**: Fluid micro-animations and layout transitions.
- **Radix UI**: High-accessibility primitives (Dialogs, Tabs, Switches, Dropdowns).
- **Sonner**: Premium, non-intrusive toast notifications.
- **Lucide-React**: A consistent, industry-standard iconography set.
- **Visual Micro-features**:
  - **Cobe**: High-performance interactive 3D Globe on the landing page.
  - **Tsparticles**: Dynamic background effects and interactive particle canvases.
  - **Next-Themes**: Deep integration for system-level Dark/Light mode switching.

---

## 💎 Detailed Feature Audit

### ⚡ Professional Collaboration
- **Synced Code Editor**: Real-time multi-cursor support. See exactly where your teammates are typing.
- **Integrated Video Rooms**: Jump on a call instantly without leaving your coding environment.
- **Language Support**: Instant syntax highlighting and intelligent auto-completion for 10+ languages.
- **Public & Private Access**: Create open rooms for community contribution or secure, invite-only rooms for sensitive projects.

### 🛡️ Institutional-Grade Security
- **Email Verification Pipeline**: Mandatory OTP verification during signup via **Resend** to prevent spam and bot accounts.
- **Intelligent Rate Limiting**: Middleware-level protection against brute-force attacks and API abuse using a custom token-bucket implementation.
- **Robust CSP**: Secure Content Security Policy (CSP) headers protecting against XSS and unauthorized script injection.
- **OTP Expiration Logic**: 60-minute limited window for verification codes and password reset tokens.

### 🏘️ Community Hub
- **Dynamic Directories**: Searchable member directories with real-time stats.
- **Event Management**: List and discover upcoming developer workshops and sessions.
- **Discussions Feed**: Topic-based threads for asynchronous knowledge sharing.

### 👤 Dashboard & Productivity
- **Activity Timeline**: Visual history of your hosted and joined rooms.
- **Room Bookmarking**: persistent "Saved Rooms" cache using **LocalStorage** for fast access.
- **Profile Management**: Customizable display names and avatar generation using `ui-avatars`.

---

## 📁 Architecture Overview

```text
src/
├── app/               # Next.js 15 App Router & API Endpoints
│   ├── (auth)/        # Auth routes (Sign-in, Signup, Verify, Forgot/Reset)
│   ├── api/           # Backend API layer (Room, Community, Presence)
│   ├── community/     # Community module
│   └── dashboard/     # User control center
├── components/        # Shared UI components & Features
├── helpers/           # Utility functions (Email dispatch, OTP generators)
├── lib/               # Singleton instances (DB connect, Utils)
├── models/            # Mongoose schemas (User, Room, Event, Activity)
└── middleware.ts      # Auth guards, security headers, & rate limiting
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- MongoDB instance (local or Atlas)

### 1. Installation
```bash
npm install
```

### 2. Environment Variables (`.env.local`)
Create a `.env.local` file in the root with the following keys:
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Auth
NEXTAUTH_SECRET=generate_a_long_random_string
NEXTAUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Real-time (Liveblocks)
LIVEBLOCKS_SECRET_KEY=your_liveblocks_key

# Video (Stream SDK)
NEXT_PUBLIC_STREAM_API_KEY=your_stream_key
STREAM_API_SECRET=your_stream_secret
```

### 3. Development
```bash
npm run dev
```
Visit `http://localhost:3000` to start building.

---

## 📜 Future Roadmap
- [ ] **Presence API**: Detailed "Who is Online" tracking across the app.
- [ ] **Room Recordings**: Save video sessions directly to cloud storage.
- [ ] **AI Pair Programmer**: Integrated LLM support within the collaborative editor.

---
