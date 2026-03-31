# DevMeet 🚀

**DevMeet** is a high-performance, real-time collaboration environment designed for modern developer teams. It combines professional-grade coding tools with seamless video communication to bridge the gap between building and talking.

We recently achieved a **100% Zero-Error Production-Ready Build**, ensuring strict TypeScript compliance, robust hook dependency management, and highly optimized serverless database connections.

---

## 🛠️ Exhaustive Tech Stack

### Framework & Language
- **Next.js 15**: Leveraging the **App Router**, **Server Actions**, and **Turbopack** for mission-critical performance.
- **TypeScript**: Full strict-mode type safety across the entire stack, completely eliminating `any` types and ensuring robust prop interfaces.

### Real-Time & Collaboration
- **Liveblocks**: Powering multiplayer presence, awareness, live cursors, and state synchronization.
- **Yjs**: Ensuring conflict-free collaborative editing through Operational Transformation (OT) / CRDT logic via `@liveblocks/yjs`.
- **CodeMirror 6**: A modular, extensible code editor with dynamic syntax highlighting for 10+ languages.
- **Piston API Integration**: Remote code execution environment supporting JS, TS, Python, Java, C++, and more with interactive stdin/stdout panels.

### Communication Suite
- **Stream Video SDK (@stream-io/video-react-sdk)**:
  - Low-latency video rooms with host-only moderation controls (mute/pause/remove).
  - Pre-join lobbies with hardware toggles and resilient video grids.
  - Floating menu interfaces with glassmorphic UI elements and custom avatars.
- **Stream Chat**: Integrated real-time messaging inside rooms.

### Authentication & Delivery
- **NextAuth.js**: Robust session management featuring **Google**, **GitHub**, and **Credentials** (Email/Password) Providers.
- **Auto-Provisioning**: Seamless onboarding for OAuth users with auto-generated unique usernames and profile avatar syncing.
- **bcryptjs**: Secure password hashing with industrial-standard salting (12 rounds) for local accounts.
- **Resend**: Transactional email delivery for OTP verification.
- **React Email**: Beautifully designed, accessible email templates via `@react-email/components`.

### Database & Validation
- **MongoDB & Mongoose**: Flexible document store utilizing **Global Connection Caching** to prevent connection pooling exhaustion in serverless environments (Vercel).
- **Zod**: Runtime schema validation for API requests, form submissions, and authentication guards.

### UI / UX Architecture
- **Tailwind CSS 4**: Modern, performance-first utility styling.
- **Framer Motion**: Fluid micro-animations and layout transitions.
- **Radix UI**: High-accessibility primitives for complex interactions.
- **Sonner**: Premium, non-intrusive toast notification system.
- **Lucide-React**: Clean and consistent iconography.
- **Visual Micro-features**:
  - **Cobe**: High-performance interactive 3D Globe on the landing page.
  - **MagicUI & Aceternity**: Premium background effects and interactive UI elements.
  - **Next-Themes**: Deep integration for system-level Dark/Light mode switching directly synced to the code editor.

---

## 💎 Detailed Feature Audit

### ⚡ Professional Collaboration
- **Synced Code Editor**: Real-time multi-cursor support. See exactly where your teammates are typing with custom-colored name tags.
- **Integrated Video Rooms**: Jump on a call instantly alongside the coding environment without sacrificing screen real-estate. Featuring a unified rigid sidebar layout.
- **Live Code Execution**: Compile and execute code against remote runners directly within the web app.
- **Public & Private Access**: Create open rooms for community contribution or secure, invite-only rooms for sensitive projects.

### 👥 Social & Community Hub
- **Friend System**: Send, receive, and manage friend requests via email or unique auto-generated usernames.
- **Dynamic Directories**: Searchable member directories with real-time stats.
- **Event Management**: List and discover upcoming developer workshops and sessions.

### 🛡️ Institutional-Grade Security & Stability
- **Zero-Error Architecture**: Conforms to the highest ESLint and Next.js compilation standards, guaranteeing a silent, bug-free build process.
- **Email Verification Pipeline**: Mandatory OTP verification during signup via **Resend** to prevent spam and bot accounts.
- **Intelligent Rate Limiting**: Protection against brute-force attacks and API abuse.
- **Robust CSP**: Secure Content Security Policy (CSP) headers protecting against XSS and unauthorized script injection.

### 👤 Dashboard & Productivity
- **Activity Timeline**: Visual history of your hosted and joined rooms.
- **Room Management**: Persisted storage of historical rooms and creator-only deletion policies.
- **Profile Generation**: Customizable display names and intelligent automatic avatar generation using `ui-avatars`.

---

## 📁 Architecture Overview

```text
src/
├── app/               # Next.js 15 App Router & API Endpoints
│   ├── (auth)/        # Auth routes (Sign-in, Signup, Verify)
│   ├── api/           # Backend API layer (Room, Community, Friends, Code Execution)
│   ├── dashboard/     # User control center
│   └── room/          # Dynamic collaboration environment
├── components/        # Shared UI components (Editor, Video Call, Layouts)
├── helpers/           # Utility functions (Email dispatch, OTP generators)
├── lib/               # Singleton instances (Cached DB Connect, Utils)
├── models/            # Mongoose schemas (User, Room, Friendship, Event)
└── middleware.ts      # Auth guards & security headers
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- MongoDB cluster (Atlas) or local instance

### 1. Installation
```bash
npm install
```

### 2. Environment Variables (`.env.local`)
Create a `.env.local` file in the root directory with the following keys. Ensure you do not commit this file to version control.

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<AppName>

# NextAuth Configuration
NEXTAUTH_SECRET=generate_a_long_random_string
NEXTAUTH_URL=http://localhost:3000

# Liveblocks (Collaborative Editor)
LIVEBLOCKS_SECRET_KEY=sk_prod_...

# Stream Video & Chat (Video Conferencing)
NEXT_PUBLIC_STREAM_VIDEO_API_KEY=your_public_stream_key
STREAM_VIDEO_API_KEY=your_stream_api_key
STREAM_VIDEO_API_SECRET=your_secret_stream_key
STREAM_API_SECRET=your_secret_stream_key

# Email Delivery (Resend)
RESEND_API_KEY=re_...

# OAuth Providers (Google & GitHub)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. Development
```bash
npm run dev
```
Visit `http://localhost:3000` to start building.

### 4. Production Build
To verify production readiness of your local environment:
```bash
npm run build
npm run start
```

---

## 📜 Future Roadmap
- [ ] **AI Pair Programmer**: Integrated LLM support within the collaborative editor to auto-complete logic and debug issues.
- [ ] **Room Recordings**: Save video sessions directly to cloud storage.
- [ ] **Advanced Organization Teams**: Role-based access control and organizational hierarchies.
