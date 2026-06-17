# DevMeet

> A full-stack, real-time collaborative coding platform with integrated video conferencing, AI-powered interviewing, a sandboxed code execution engine, and a community hub.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Technology Stack](#3-technology-stack)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Shared Package (`packages/shared`)](#5-shared-package-packagesshared)
6. [Server App (`apps/server`)](#6-server-app-appsserver)
   - [Entry Point & App Setup](#entry-point--app-setup)
   - [Configuration](#configuration)
   - [Middlewares](#middlewares)
   - [Database Models](#database-models)
   - [API Routes & Controllers](#api-routes--controllers)
   - [Services](#services)
   - [Real-Time Collaboration (WebSocket + Yjs)](#real-time-collaboration-websocket--yjs)
   - [Job Queues (BullMQ)](#job-queues-bullmq)
7. [Worker App (`apps/worker`)](#7-worker-app-appsworker)
   - [Worker Entry Point](#worker-entry-point)
   - [Code Executors (Docker)](#code-executors-docker)
   - [Job Processors](#job-processors)
8. [Client App (`apps/client`)](#8-client-app-appsclient)
   - [Routing & App Shell](#routing--app-shell)
   - [React Contexts](#react-contexts)
   - [Pages](#pages)
   - [Collaboration Layer](#collaboration-layer)
   - [Components](#components)
     - [Global Components](#global-components)
     - [Editor](#editor)
     - [Room Structure](#room-structure)
     - [AI Problem Builder](#ai-problem-builder)
     - [AI Interview](#ai-interview)
     - [Normal Interview](#normal-interview)
     - [Practice Mode](#practice-mode)
     - [Room Utilities](#room-utilities)
     - [UI Primitives](#ui-primitives)
   - [Client Services](#client-services)
   - [Design System (`index.css`)](#design-system-indexcss)
9. [Deployment](#9-deployment)
   - [Docker Compose (Development)](#docker-compose-development)
   - [Docker Compose (Production)](#docker-compose-production)
   - [Nginx Reverse Proxy](#nginx-reverse-proxy)
10. [Environment Variables](#10-environment-variables)
11. [Running Locally (Dev Mode)](#11-running-locally-dev-mode)
12. [API Reference](#12-api-reference)

---

## 1. Project Overview

DevMeet is an all-in-one developer collaboration platform. It lets developers:

- **Collaborate** on code in real-time with multiple users editing the same file simultaneously (powered by Yjs CRDTs).
- **Video call** their collaborators without leaving the editor (powered by Stream Video SDK).
- **Practice** coding problems solo in a structured environment with test case evaluation.
- **Conduct or join mock interviews** — either peer-to-peer with a real person, or with an AI interviewer powered by Google Gemini.
- **Run code** in isolated Docker containers (sandboxed execution) supporting 9 languages.
- **Build problems** from scratch using an AI Problem Builder that generates full problem statements, starter code, driver code, and test cases from a topic, a natural language prompt, a pasted statement, or a LeetCode reference.
- **Explore the community**, find other developers, and send friend requests.
- **Experience a fluid UI across all devices**, thanks to a mobile-responsive redesign using Tailwind CSS built on top of a brutalist aesthetic.
- **Enjoy high performance**, with Redis-backed caching and smart invalidation patterns seamlessly integrating AI problems into active rooms in real-time.

---

## 2. Monorepo Structure

DevMeet is an **npm workspaces monorepo** with three apps and one shared package:

```
DEVMEET/
├── apps/
│   ├── client/          # React + Vite frontend (SPA)
│   ├── server/          # Express.js + WebSocket backend
│   └── worker/          # BullMQ worker (sandboxed code execution)
├── packages/
│   └── shared/          # Shared TypeScript types and constants
├── package.json         # Root monorepo config (npm workspaces)
├── docker-compose.yml   # Local dev/CI orchestration
├── docker-compose.prod.yml
├── nginx.conf           # Nginx reverse proxy config
└── .env.example         # Template for all required environment variables
```

The root `package.json` defines workspace scripts:

| Script | What it does |
|---|---|
| `npm run dev` | Runs server + client concurrently using `concurrently` |
| `npm run dev:server` | Runs Express server in dev mode only |
| `npm run dev:client` | Runs Vite dev server only |
| `npm run dev:worker` | Runs BullMQ worker in dev mode only |
| `npm run build` | Builds all packages in dependency order: shared → server → worker → client |
| `npm run typecheck` | Type-checks all workspaces |
| `npm run lint` | Lints all workspaces |

---

## 3. Technology Stack

### Frontend (`apps/client`)
| Concern | Technology |
|---|---|
| Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Routing | React Router v6 |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Real-Time Sync | Yjs + y-monaco + y-websocket (custom provider) |
| Video Calling | Stream Video React SDK (`@stream-io/video-react-sdk`) |
| UI Layout | `react-resizable-panels` |
| Toast Notifications | Sonner |
| Icons | Lucide React |
| HTTP Client | Axios (`services/api.ts`) |
| Styling | Vanilla CSS + Tailwind CSS (utility layer) |
| Fonts | Space Grotesk + JetBrains Mono (Google Fonts) |

### Backend (`apps/server`)
| Concern | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js with TypeScript |
| Database | MongoDB via Mongoose |
| Cache / Pub-Sub | Redis (ioredis) |
| Authentication | JWT (httpOnly cookie) + Google OAuth + GitHub OAuth |
| Real-Time | WebSocket (`ws`) + `y-websocket` |
| Email | Resend API |
| Video Token | Stream Video Node SDK |
| AI | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| Job Queue | BullMQ (producer side) |
| Validation | Zod |
| Security | Helmet, CORS, bcryptjs, Redis rate limiter |

### Worker (`apps/worker`)
| Concern | Technology |
|---|---|
| Job Queue | BullMQ (consumer side) |
| Code Execution | Docker (`docker exec` via Node.js `child_process.spawn`) |
| Database | MongoDB (Mongoose, for writing execution results) |
| Supported Languages | JavaScript, Python, C, C++, Java, Go, Ruby, PHP, Rust |

### Infrastructure
| Concern | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Shared Types | `@devmeet/shared` (internal npm package) |

---

## 4. Architecture & Data Flow

```
Browser (React SPA)
      │
      │  HTTP/REST (Axios)      ┌────────────────┐
      ├─────────────────────────► Express Server  │
      │                          │  (port 5000)   │
      │  WebSocket               │                │
      ├─────────────────────────►│ /collaboration │
      │  (Yjs CRDT sync)         │ /:roomId       │
      │                          └──────┬─────────┘
      │                                 │
      │  Stream Video SDK (WebRTC)      │  MongoDB (Mongoose)
      └────────────────────────         │  Redis (cache + pub-sub)
            getstream.io                │
                                        │  BullMQ → Redis Queue
                                        │        │
                                        │   ┌────▼──────┐
                                        │   │  Worker   │
                                        │   │  (BullMQ) │
                                        │   │  Docker   │
                                        │   │  Executor │
                                        │   └───────────┘
                                        │   publishes result to
                                        │   Redis channel
                                        │   → Yjs ydoc.metadata
                                        │   → Client sees result
```

**Key execution flow for code run:**
1. Client calls `POST /api/execution/run` with code, languageId, roomId.
2. Server validates, creates an `ExecutionJob` doc in MongoDB, and enqueues a job into BullMQ (`code-execution` queue).
3. Server returns `202 Accepted` immediately with `jobId`.
4. Worker picks up the job, runs code in a persistent Docker container via `docker exec`.
5. Worker updates the `ExecutionJob` doc in MongoDB and publishes the result to a Redis channel `room:execution:<roomId>`.
6. The WebSocket server's Yjs room manager is subscribed to that channel. It receives the result and writes it into the Yjs document's `metadata` map (`lastExecution`).
7. All clients in the room observing that Yjs map key receive the result in real-time — **no polling needed**.

---

## 5. Shared Package (`packages/shared`)

**Location:** `packages/shared/src/`

This is a local TypeScript package (`@devmeet/shared`) imported by both the server and the client. It ensures type safety across the entire stack.

### `packages/shared/src/types/index.ts`
Contains all shared TypeScript interfaces and types used across the monorepo:

| Type | Description |
|---|---|
| `IUser` | Full user object (id, name, email, username, avatar, bio, isVerified, pinnedRooms, etc.) |
| `IRoom` | Room document (roomId, mode, interviewType, participants, problemId, settings, etc.) |
| `IProblem` | Coding problem (title, slug, difficulty, description, examples, constraints, tags, starterCode, driverCode, testCases, solution) |
| `ProblemTestCase` | A single test case (input, expectedOutput, hidden, type, explanation) |
| `IInterviewSession` | Interview session record (roomId, interviewerId, candidateId, problemId, status, durationMinutes, aiConfig, etc.) |
| `IInterviewSubmission` | A single code submission within an interview |
| `IPracticeAttempt` | A practice mode attempt record |
| `IAIInterviewMessage` | A single message in an AI interview chat |
| `IAIInterviewReport` | Final evaluation report from AI interview |
| `RoomMode` | `'collaboration' | 'practice' | 'interview'` |
| `InterviewType` | `'normal' | 'ai' | null` |
| `ProblemDifficulty` | `'easy' | 'medium' | 'hard'` |
| `SUPPORTED_LANGUAGES` | Array of `{ id: number, name: string }` for all 9 supported languages |
| `DOCKER_LANGUAGE_MAP` | Maps language ID → Docker image name string |

---

## 6. Server App (`apps/server`)

### Entry Point & App Setup

#### `apps/server/src/server.ts`
The main entry point. Performs startup in this order:
1. Calls `validateEnv()` — hard-fails if any required env var is missing.
2. Calls `connectDB()` — connects Mongoose to MongoDB.
3. Starts Express `app.listen()` on `process.env.PORT` (default 5000), binding to `0.0.0.0`.
4. Calls `setupWebSocketServer(server)` — attaches the Yjs WebSocket server to the same HTTP server on the `/collaboration/:roomId` path.
5. Registers `process.on('uncaughtException')` and `process.on('unhandledRejection')` for graceful crash logging.

#### `apps/server/src/app.ts`
Configures the Express app:
- **Security:** `helmet()` sets security headers; `cors()` restricts to `CLIENT_URL` with credentials allowed.
- **Parsing:** `express.json({ limit: '5mb' })`, `express.urlencoded()`, `cookieParser()`.
- **Logging:** `morgan('dev')` in non-test environments.
- **Compression:** `compression()` for response gzip.
- **Health check:** `GET /health` returns MongoDB and Redis status.
- **All 12 API route groups** mounted under `/api/*`.
- **404 handler** and global **error handler** at the end.

### Configuration

#### `apps/server/src/config/env.ts`
Validates and exports all environment variables with type safety. Fails fast at startup if required variables are missing. Key variables include: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `REDIS_URL`, `STREAM_VIDEO_API_KEY`, `STREAM_VIDEO_API_SECRET`, `RESEND_API_KEY`, `GEMINI_API_KEY`, `BCRYPT_SALT_ROUNDS`.

#### `apps/server/src/config/db.ts`
Mongoose connection setup with retry logic.

#### `apps/server/src/config/redis.ts`
Exports two ioredis instances:
- `redis` — for general operations (get, set, setex, publish, rate limiting).
- `redisSubscriber` — a dedicated subscriber connection (a Redis subscriber cannot send commands, so a separate instance is required). Used by the Yjs room manager to subscribe to execution result channels.

### Middlewares

#### `apps/server/src/middlewares/auth.middleware.ts`
`requireAuth` middleware:
1. Reads JWT from the `token` httpOnly cookie.
2. Falls back to `Authorization: Bearer <token>` header.
3. Verifies the token using `verifyToken()`.
4. Attaches decoded payload to `req.user`.
5. Returns `401` if token is missing or `401` if token is invalid/expired.

#### `apps/server/src/middlewares/error.middleware.ts`
Global Express error handler (`errorHandler`). Catches errors passed via `next(error)` throughout all controllers. Returns a consistent JSON shape: `{ success: false, error: { code, message } }`. Also exports `createError()` helper to create structured errors.

#### `apps/server/src/middlewares/rateLimit.middleware.ts`
Redis-backed rate limiter using a sliding window counter stored in Redis. Factory function `createRateLimitMiddleware({ scope, limit, windowSeconds, identifier })`:
- `identifier: 'ip'` — rate limits per IP address.
- `identifier: 'email_ip'` — rate limits per `email + IP` combination (used for OTP endpoints to prevent abuse per user+IP pair).
- Uses Redis `INCR` + `EXPIRE` pattern. Returns `429 Too Many Requests` when the limit is hit.

### Database Models

All models are defined using Mongoose and live in `apps/server/src/models/`.

#### `User.ts`
| Field | Type | Notes |
|---|---|---|
| `name` | String | 2–50 chars, alphanumeric + spaces |
| `email` | String | Unique, lowercase |
| `password` | String | Null for OAuth users |
| `username` | String | Unique, 3–30 chars, `[a-zA-Z0-9_-]` |
| `isVerified` | Boolean | Must be true to log in |
| `verifyCode` | String | 6-digit OTP for email verification / password reset |
| `verifyCodeExpiry` | Date | OTP expires after 1 hour |
| `avatar` | String | URL to profile picture |
| `bio` | String | Max 500 chars |
| `lastActive` | Date | Updated on activity |
| `pinnedRooms` | [String] | Array of pinned `roomId` strings |

#### `Room.ts`
| Field | Type | Notes |
|---|---|---|
| `roomId` | String | Unique, human-readable ID (e.g., `x4f9kz2mab`) |
| `mode` | String | `'collaboration' \| 'practice' \| 'interview'` |
| `interviewType` | String | `'normal' \| 'ai' \| null` |
| `title` | String | Optional human-readable title |
| `settings` | Object | `{ videoEnabled, collaborationEnabled, isSolo }` |
| `problemId` | ObjectId | Ref to `Problem` (for practice/interview rooms) |
| `status` | String | `'active' \| 'ended' \| 'archived'` |
| `createdBy` | ObjectId | Ref to `User` |
| `participants` | [ObjectId] | All users who have joined |
| `interviewSessionId` | ObjectId | Ref to `InterviewSession` |
| `interviewParticipants` | Array | Each entry has `userId`, `role` (`owner/interviewer/candidate/viewer`), `status` |

#### `Problem.ts`
| Field | Type | Notes |
|---|---|---|
| `title` | String | Problem title |
| `slug` | String | Unique URL slug |
| `difficulty` | String | `'easy' \| 'medium' \| 'hard'` |
| `description` | String | Markdown-formatted problem statement |
| `examples` | Array | `{ input, output, explanation }` |
| `constraints` | [String] | Problem constraints |
| `tags` | [String] | Topic tags (arrays, trees, etc.) |
| `starterCode` | Object | `{ cpp, python, javascript }` — boilerplate code for each language |
| `driverCode` | Object | `{ cpp, python, javascript }` — code that reads stdin and calls the starter function |
| `testCases` | Array | `{ input, expectedOutput, hidden, type, source }` |
| `solution` | Object | `{ approach, timeComplexity, spaceComplexity, referenceCode }` |
| `source` | String | `'manual' \| 'leetcode' \| 'ai' \| 'custom' \| 'pasted' \| 'leetcode_style'` |
| `isPublic` | Boolean | Whether the problem is publicly visible |

#### `InterviewSession.ts`
Tracks a live interview session:

| Field | Notes |
|---|---|
| `roomId` | Links to the Room |
| `interviewerId` / `candidateId` | User IDs of participants |
| `problemId` | The problem being solved |
| `status` | `'scheduled' \| 'active' \| 'completed' \| 'cancelled' \| 'expired'` |
| `interviewType` | `'normal' \| 'ai'` |
| `durationMinutes` | Time limit for the session |
| `startedAt` / `endedAt` / `expiresAt` | Timestamps |
| `aiConfig` / `aiState` | Mixed schema for storing AI interview config and ongoing state |

#### `InterviewSubmission.ts`
Each code submission made during a normal interview. Stores: `sessionId`, `roomId`, `userId`, `code`, `language`, `testResults`, `score`, and timestamps.

#### `PracticeAttempt.ts`
Each attempt at a practice problem. Stores: `userId`, `roomId`, `problemId`, `code`, `language`, `testResults` (pass/fail per test case), `passedCount`, `totalCount`, `status` (`passed / failed / partial`), and timing.

#### `AIInterviewMessage.ts`
A single message in an AI interview chat. Fields: `sessionId`, `roomId`, `role` (`user / assistant`), `content`, `messageType` (`chat / hint / code_review / evaluation`).

#### `AIInterviewReport.ts`
The final AI-generated evaluation. Stores scores (correctness, approach, complexity, codeQuality, communication, overall), strengths, weaknesses, suggestions, time/space complexity, and summary.

#### `AIProblemGeneration.ts`
Audit trail for AI problem generation requests. Stores the generation method, input params, generated problem ID, and status.

#### `ExecutionJob.model.ts`
Represents a single code run queued through BullMQ. Fields: `jobId` (UUID), `roomId`, `userId`, `language`, `languageId`, `code`, `stdin`, `status` (`queued / running / completed / failed / timeout`), `stdout`, `stderr`, `errorMessage`, `executionTimeMs`.

#### `collaboration.model.ts`
The `CollaborationDocument` model. Stores the binary Yjs document state (as a Buffer) per room. Used to persist and restore the collaborative editor content across sessions.

| Field | Notes |
|---|---|
| `roomId` | Unique room identifier |
| `yjsState` | Binary blob (Uint8Array → Buffer) of the full Yjs document |

#### `Discussion.ts`
Community post/discussion model for the community page. Fields: `title`, `content`, `authorId`, `tags`, `upvotes`, `downvotes`, `commentCount`.

#### `Event.ts`
Community event model. Fields: `title`, `description`, `organizer`, `startDate`, `endDate`, `link`, `type`.

#### `Friendship.ts`
Tracks friend relationships between users. Fields: `requesterId`, `addresseeId`, `status` (`pending / accepted / rejected / blocked`).

#### `InterviewEvent.ts`
Audit log events within an interview session (e.g., timer started, submission made, hint requested).

### API Routes & Controllers

All routes are mounted in `apps/server/src/app.ts`. Below is a complete map of every route:

#### `/api/auth` — `auth.routes.ts` / `auth.controller.ts`

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/signup` | No | 5/hr per IP | Step 1: Creates unverified user, sends 6-digit OTP via email |
| `POST` | `/complete-signup` | No | 5/10min per IP+email | Step 2: Verifies OTP, sets password, marks user as verified, sets JWT cookie |
| `POST` | `/login` | No | 5/15min per IP | Authenticates with email/username + password, sets JWT cookie |
| `POST` | `/logout` | No | — | Clears `token` cookie |
| `POST` | `/verify-otp` | No | 5/10min per IP+email | Verifies OTP for standalone verification |
| `POST` | `/forgot-password` | No | 3/10min per IP+email | Sends password reset OTP to email |
| `POST` | `/reset-password` | No | 5/10min per IP+email | Resets password using OTP |
| `GET` | `/google` | No | — | Redirects to Google OAuth consent screen |
| `GET` | `/google/callback` | No | — | Handles Google OAuth callback, creates/finds user, sets JWT cookie |
| `GET` | `/github` | No | — | Redirects to GitHub OAuth |
| `GET` | `/github/callback` | No | — | Handles GitHub OAuth callback |
| `GET` | `/me` | ✅ | — | Returns full user profile (Redis-cached for 5 min) |

**Signup flow detail:**
- `POST /signup` → creates user with `isVerified: false`, `password: null`, sends OTP.
- `POST /complete-signup` → verifies OTP, hashes and sets password, marks `isVerified: true`, issues JWT.
- Password must meet: 8+ chars, uppercase, lowercase, digit, special character.
- JWT is stored as an httpOnly, `SameSite: none` (on HTTPS) or `lax` (on HTTP) cookie, valid for 7 days.

#### `/api/rooms` — `room.routes.ts` / `room.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | Get all rooms the user owns or is a participant in |
| `POST` | `/` | ✅ | Create a new room (mode, interviewType, title, roomId) |
| `GET` | `/:roomId` | ✅ | Get a specific room by roomId |
| `POST` | `/:roomId/join` | ✅ | Join a room (adds user to participants) |
| `DELETE` | `/:roomId` | ✅ | Delete a room (only owner can delete) |
| `PATCH` | `/:roomId/problem` | ✅ | Set or update the problem assigned to a room |

#### `/api/execution` — `execution.routes.ts` / `execution.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/run` | ✅ | Queue a code execution job (validates room membership first) |
| `GET` | `/jobs/:jobId` | ✅ | Poll execution job status by jobId |

#### `/api/stream` — `stream.routes.ts` / `stream.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/token` | ✅ | Generate a Stream Video token for the authenticated user |
| `GET` | `/token/:roomId` | ✅ | Generate a Stream Video token scoped to a specific room |

The `stream.controller.ts` uses the Stream Node SDK to generate a user token signed with the Stream API secret.

#### `/api/users` — `user.routes.ts` / `user.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/active` | ✅ | Get list of recently active users (last 10 min) |
| `POST` | `/pinned-rooms/:roomId` | ✅ | Toggle pin/unpin a room for the current user |
| `PUT` | `/profile` | ✅ | Update user profile (name, bio, avatar URL) |

#### `/api/problems` — `problem.routes.ts` / `problem.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | List all public problems |
| `GET` | `/:problemId` | ✅ | Get a single problem by ID |

#### `/api/practice` — `practice.routes.ts` / `practice.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/submit` | ✅ | Submit code for a practice problem (runs against all test cases) |
| `GET` | `/attempts` | ✅ | Get all practice attempts for the current user |
| `GET` | `/attempts/:roomId` | ✅ | Get practice attempts for a specific room |

#### `/api/interviews` — `interview.routes.ts` / `interview.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/:roomId/session` | ✅ | Create an interview session for a room |
| `GET` | `/:roomId/session` | ✅ | Get the active interview session for a room |
| `PATCH` | `/:roomId/session/start` | ✅ | Start the interview timer |
| `PATCH` | `/:roomId/session/end` | ✅ | End the interview session |
| `POST` | `/:roomId/submit` | ✅ | Submit candidate's code (creates InterviewSubmission, queues evaluation job) |

#### `/api/ai-interviews` — `aiInterview.routes.ts` / `aiInterview.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/session` | ✅ | Initialize an AI interview session with problem config |
| `POST` | `/message` | ✅ | Send a message in the AI interview chat (gets AI response) |
| `POST` | `/hint` | ✅ | Request a hint from the AI interviewer |
| `POST` | `/review` | ✅ | Request AI code review |
| `POST` | `/evaluate` | ✅ | Request final AI evaluation (generates report) |
| `GET` | `/session/:roomId` | ✅ | Get AI interview session state |

#### `/api/ai-problems` — `aiProblem.routes.ts` / `aiProblem.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/generate/topic` | ✅ | Generate a problem from a topic string |
| `POST` | `/generate/prompt` | ✅ | Generate a problem from a natural language prompt |
| `POST` | `/generate/paste` | ✅ | Structure a pasted problem statement |
| `POST` | `/generate/leetcode-style` | ✅ | Generate a LeetCode-inspired (but original) problem |
| `POST` | `/test-cases` | ✅ | Generate additional test cases for a problem |
| `POST` | `/assign` | ✅ | Assign a generated problem to a room |

#### `/api/community` — `community.routes.ts` / `community.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | ✅ | Search and list community users |
| `GET` | `/users/:userId` | ✅ | Get a user's public profile |
| `GET` | `/stats` | ✅ | Get community-wide statistics |

#### `/api/friends` — `friends.routes.ts` / `friends.controller.ts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | List all friends and pending requests |
| `POST` | `/request/:userId` | ✅ | Send a friend request |
| `PATCH` | `/request/:friendshipId/accept` | ✅ | Accept a friend request |
| `PATCH` | `/request/:friendshipId/reject` | ✅ | Reject a friend request |

### Services

#### `apps/server/src/services/email.service.ts`
Wraps the Resend API to send transactional emails. Exports `sendVerificationEmail(email, username, code, type)` which sends different email templates for:
- `'verify'` — account verification OTP email.
- `'reset'` — password reset OTP email.

#### `apps/server/src/services/ai/`

The AI layer uses a provider-pattern abstraction:

**`aiTypes.ts`** — defines the `AIProvider` interface and `AIGenerateRequest` type.

**`aiProvider.ts`** — exports a singleton `aiProvider` instance. Currently uses `GeminiProvider`.

**`geminiProvider.ts`** — implements `AIProvider` using `@google/generative-ai`:
- Uses model `gemini-2.0-flash` by default.
- Supports system prompt, multi-turn conversation history, JSON response mode.
- Includes retry logic with exponential backoff (3 attempts) for rate limit errors (429) and server errors (500/503).

**`aiPrompts.ts`** — all AI prompt templates:
- `SYSTEM_INTERVIEWER_PROMPT` — system prompt that defines the AI interviewer persona and rules (no giving full solutions, progressive hints, etc.)
- `HINT_PROMPT_TEMPLATE(problemContext, currentCode, hintLevel)` — generates contextual hints at levels 1 (vague) to 3 (specific).
- `CODE_REVIEW_PROMPT_TEMPLATE(...)` — code review prompt that includes the problem, candidate code, and execution results.
- `FINAL_EVALUATION_PROMPT_TEMPLATE(...)` — generates a full JSON evaluation report with scores for: correctness, approach, complexity, codeQuality, communication, overall. Also includes strengths, weaknesses, suggestions, time/space complexity.
- `GENERATE_PROBLEM_PROMPT_TEMPLATE(topic, difficulty, style)` — simple problem generation.
- `buildGenerateTestCasesPrompt(ctx)` — generates test cases with a mix of basic, edge, corner, large, and random types.
- `buildProblemFromTopicPrompt(...)` — generates a full problem (with starter code, driver code, test cases, solution) from a topic.
- `buildProblemFromNaturalPrompt(...)` — same but from a free-form user prompt.
- `buildProblemFromPastedStatementPrompt(...)` — parses and structures a pasted problem statement.
- `buildLeetCodeStyleProblemPrompt(...)` — generates an ORIGINAL problem inspired by (but not copying) a LeetCode reference.

**`aiContextBuilder.ts`** — helper that builds the problem context string passed into prompts from an `InterviewSession`'s problem data.

**`aiInterview.service.ts`** — orchestrates AI interview sessions: initializing state, appending messages, calling the appropriate prompt builder, and persisting messages and session state to MongoDB.

**`aiProblem.service.ts`** — handles AI problem generation: calls the appropriate prompt builder, parses the JSON response from Gemini, creates a `Problem` document in MongoDB, and creates an `AIProblemGeneration` audit record.

#### `apps/server/src/services/interview.service.ts`
Business logic for normal (peer) interviews: creating sessions, assigning roles, starting/ending sessions, managing submission queuing.

#### `apps/server/src/services/practice.service.ts`
Logic for practice mode: running code against all test cases, calculating pass/fail, creating `PracticeAttempt` records.

#### `apps/server/src/services/problem.service.ts`
CRUD logic for the `Problem` model.

### Real-Time Collaboration (WebSocket + Yjs)

#### `apps/server/src/collaboration/authSocket.ts`
Authenticates WebSocket upgrade requests. Reads the JWT from the `Cookie` header of the HTTP upgrade request. Verifies it. Also applies per-user rate limiting to the WebSocket connection (using Redis).

#### `apps/server/src/collaboration/websocketServer.ts`
Attaches a `ws.WebSocketServer` to the existing HTTP server using `noServer: true`:
- Intercepts `server.on('upgrade')` events.
- Matches the URL against `/collaboration/:roomId` regex.
- Calls `authenticateSocket()` — rejects with 401 or 429 on failure.
- Upgrades the connection and emits it as a `connection` event.
- Implements a heartbeat mechanism (ping every 30s, terminates stale connections).
- Hands off every authenticated connection to `handleYjsConnection()`.

#### `apps/server/src/collaboration/yjsRoomManager.ts`
The heart of real-time collaboration. Uses `y-websocket/bin/utils` and configures custom **persistence** and **Redis pub-sub**:

**Persistence (MongoDB):**
- `bindState` — when a client connects to a room, loads the existing Yjs document state from `CollaborationDocument` in MongoDB and applies it to the in-memory `ydoc`.
- `writeState` — when the last client disconnects from a room, saves the full Yjs document state (as a binary Uint8Array/Buffer) back to MongoDB.

**Redis Pub-Sub (horizontal scaling):**
- Subscribes to `yjs:room:<roomId>` on the `redisSubscriber` connection.
- When the local `ydoc` receives an update (from a WebSocket client), it publishes that update (as base64) to the Redis channel — allowing other server instances to receive and apply it.
- When a message arrives on the Redis channel, it applies the update to the local `ydoc` with `origin='redis'` to prevent echo loops.

**Execution Result Delivery:**
- Also subscribes to `room:execution:<roomId>`.
- When the worker publishes a result to this channel, the yjsRoomManager writes it into the `ydoc`'s `metadata` map under the key `lastExecution`.
- This causes all connected clients' Yjs observers to fire, delivering the result in real-time.

**Yjs Document Structure:**
The Yjs document (`ydoc`) for each room has two shared data structures:
- `ydoc.getText('codemirror')` — the actual code content, bound to Monaco editor via `MonacoBinding`.
- `ydoc.getMap('metadata')` — shared key/value store for: `language` (selected language), `output` (last run output), `input` (stdin content), `lastExecution` (latest execution job result from server).

### Job Queues (BullMQ)

#### `apps/server/src/queues/execution.queue.ts`
Creates a BullMQ `Queue` named `'code-execution'` connected to Redis. Exports `addExecutionJob(data)` which enqueues a job with the execution payload.

#### `apps/server/src/queues/submission.queue.ts`
Creates a BullMQ `Queue` named `'interview-submission'` for queuing interview code submissions for async evaluation.

---

## 7. Worker App (`apps/worker`)

The worker is a completely separate Node.js process that:
- Connects to MongoDB for reading problem data and writing execution results.
- Consumes jobs from BullMQ queues via Redis.
- Runs code inside Docker containers.
- Publishes results back to Redis for real-time delivery to clients.

### Worker Entry Point

#### `apps/worker/src/index.ts`
Bootstrap sequence:
1. Connects to MongoDB.
2. Creates two BullMQ `Worker` instances with concurrency of 5 each:
   - `'code-execution'` queue → `executeProcessor`.
   - `'interview-submission'` queue → `submissionProcessor`.
3. Registers event handlers for `active`, `completed`, `failed`, `error` on each worker.
4. Registers `SIGTERM` / `SIGINT` handlers for graceful shutdown (closes workers, calls `singleContainerManager.cleanupAll()` to stop Docker containers).

### Code Executors (Docker)

#### `apps/worker/src/executors/languageConfig.ts`
Maps language IDs (matching `@devmeet/shared`) to Docker execution configs:

| ID | Language | Docker Image | Compile? | Timeout |
|---|---|---|---|---|
| 1 | JavaScript | `node:22-slim` | No | 10s |
| 2 | Python | `python:3.12-slim` | No | 10s |
| 3 | C | `gcc:latest` | Yes (30s) | 10s |
| 4 | C++ | `gcc:latest` | Yes (30s) | 10s |
| 5 | Java | `openjdk:22-slim` | Yes (30s) | 10s |
| 6 | Go | `golang:1.23-alpine` | Yes (30s) | 10s |
| 7 | Ruby | `ruby:3.4-slim` | No | 10s |
| 8 | PHP | `php:8.3-cli-alpine` | No | 10s |
| 9 | Rust | `rust:1.82-slim` | Yes (60s) | 10s |

Memory limits: 128MB (JS/Python/Ruby/PHP), 256MB (C/C++/Go), 512MB (Java/Rust).

#### `apps/worker/src/executors/containerPool.ts`
Manages a pool of **persistent Docker containers** — one per language image. Containers are started lazily on first use and kept alive between jobs. This avoids the high overhead of creating a new container for every execution.
- `singleContainerManager.getOrCreate(image, memoryMb, cpuLimit)` — returns a running container for the image, starting one if it doesn't exist.
- Each container mounts a shared host volume at `/sandbox` where code files are written.
- `singleContainerManager.cleanupAll()` — stops and removes all containers on shutdown.

#### `apps/worker/src/executors/dockerExecutor.ts`
`runInDocker(config, code, stdin)` — executes code inside a persistent container:
1. Validates code and stdin size against configurable limits.
2. Gets or creates the persistent container via `singleContainerManager`.
3. Creates a **per-run UUID subdirectory** inside the shared volume to avoid file collisions between concurrent runs.
4. Writes `main.<ext>` and `stdin.txt` into the subdirectory.
5. **If compiled language:** runs `docker exec container sh -c "cd /sandbox/run-<uuid> && <compileCmd>"`. Returns `compile_error` if it fails.
6. **Run step:** runs `docker exec container sh -c "cd /sandbox/run-<uuid> && timeout <N> <runCmd> < stdin.txt"`.
7. Handles: `timeout` (exit code 124), `runtime_error` (non-zero exit), `completed` (exit 0).
8. Truncates output to `MAX_OUTPUT_BYTES` (configurable, default 64KB).
9. Always cleans up the per-run subdirectory from the host volume in a `finally` block.

### Job Processors

#### `apps/worker/src/processors/execution.processor.ts`
`executeProcessor(job)` — handles `code-execution` jobs:
1. Looks up the `ExecutionJob` in MongoDB by `jobId`, marks status as `'running'`.
2. Looks up the language config from `DOCKER_LANGUAGE_CONFIGS`.
3. Calls `runInDocker(config, code, stdin)`.
4. Maps the `SandboxResult` status to the job's final status.
5. Updates the `ExecutionJob` document with `stdout`, `stderr`, `executionTimeMs`, `completedAt`.
6. Publishes the result to the Redis channel `room:execution:<roomId>` as JSON — this is how the result reaches the Yjs room and then all clients.

#### `apps/worker/src/processors/submission.processor.ts`
`submissionProcessor(job)` — handles `interview-submission` jobs:
1. Fetches the `InterviewSubmission` and associated `Problem` from MongoDB.
2. Runs the submission code against each test case using `runInDocker`.
3. Compares stdout to `expectedOutput` for each test case.
4. Calculates pass/fail counts and a final `score`.
5. Updates the `InterviewSubmission` with results.
6. Can trigger the final AI evaluation if this is the last submission for the session.

---

## 8. Client App (`apps/client`)

### Routing & App Shell

#### `apps/client/src/main.tsx`
Entry point. Wraps the app in:
- `BrowserRouter` (React Router v6)
- `AuthProvider` (global auth context)
- `ThemeProvider` (dark/light mode)
- `Toaster` (Sonner toast notifications)

#### `apps/client/src/App.tsx`
Defines the full route tree using React Router `<Routes>`:

**Public routes** (wrapped in `<PublicRoute>` — redirects to `/dashboard` if already logged in):
- `/` → `LandingPage`
- `/login` → `LoginPage`
- `/signup` → `SignupPage`
- `/verify` → `VerifyPage`
- `/forgot-password` → `ForgotPasswordPage`
- `/reset-password` → `ResetPasswordPage`

**Legacy redirects:**
- `/sign-in` → `/login`
- `/sign-up` → `/signup`

**Protected routes** (wrapped in `<ProtectedRoute>` — redirects to `/login` if not authenticated):
- `/dashboard` → `DashboardPage`
- `/create-room` → `CreateRoomPage`
- `/join-room` → `JoinRoomPage`
- `/rooms/:roomId` → `RoomPage`
- `/community` → `CommunityPage`
- `/profile` → `ProfilePage`

**Fallback:** `*` → `NotFoundPage`

The `<Navbar>` is hidden when inside a `/rooms/*` path (rooms use a full-screen immersive layout).

### React Contexts

#### `apps/client/src/context/AuthContext.tsx`
Provides `{ user, setUser, isLoading }` via `useAuth()` hook. On mount, calls `GET /api/auth/me` to hydrate the user from the server-side JWT. Stores user state in memory; no localStorage dependency.

#### `apps/client/src/context/ThemeContext.tsx`
Provides `{ theme, toggleTheme }` via `useTheme()` hook. Applies `data-theme="light"` attribute to `<html>` for the light mode CSS variable overrides in `index.css`. Default is dark mode.

### Pages

#### `LandingPage.tsx`
Public marketing page. Features hero section, feature cards, and CTA buttons. Uses `landing.css` for page-specific animations. All content is static — no API calls.

#### `LoginPage.tsx`
Thin wrapper that renders `<LoginForm />`.

#### `SignupPage.tsx`
Thin wrapper that renders `<SignupForm />`.

#### `VerifyPage.tsx`
Renders the OTP verification UI. Reads the `username` query parameter from the URL. Submits to `POST /api/auth/complete-signup` with the OTP code and chosen password. On success, navigates to `/dashboard`.

#### `ForgotPasswordPage.tsx`
Email input form. On submit, calls `POST /api/auth/forgot-password`. Navigates to `/reset-password?username=<username>` on success.

#### `ResetPasswordPage.tsx`
Reads `username` from query params. Shows 6-digit OTP + new password inputs. Calls `POST /api/auth/reset-password`. Navigates to `/login` on success.

#### `DashboardPage.tsx`
The main authenticated home page after login. Features:
- **Welcome header** with time-appropriate greeting (good morning/afternoon/evening) and user name.
- **Stats row** — Hosted Rooms count, Joined Rooms count, Total Rooms count, + Create Room button.
- **Quick Actions** — Join via Room ID, Resume Last Session.
- **Hosted Rooms grid** — rooms created by the current user with room cards.
- **Joined Rooms grid** — rooms the user has joined.
- **Online Now sidebar** — pulls from `GET /api/users/active`.
- **Recent Activity sidebar** — rooms sorted by `updatedAt`.
- **Pinned Rooms sidebar** — user's pinned rooms with quick-enter links.
- Each room card shows: room ID, creation date, mode badge, pin/unpin star button, participant avatars, "Enter Room" and "Delete" buttons.
- All inline styles follow the `--dm-*` brutalist design tokens.

#### `CreateRoomPage.tsx`
A multi-step room configuration form:
1. **Room ID display** — auto-generated 10-char alphanumeric ID with a "Copy Invite Link" button.
2. **Optional room title** input.
3. **Mode selection** — three option cards: `Collaboration`, `Practice`, `Interview`.
4. **Interview type sub-selection** (shown when mode is `'interview'`): `Peer Interview` or `AI Interview`.
5. `Create Room` button calls `POST /api/rooms`, then navigates to `/rooms/<roomId>`.

#### `JoinRoomPage.tsx`
Simple form with a room ID input. On submit, calls `POST /api/rooms/:roomId/join` and navigates to `/rooms/<roomId>` on success.

#### `RoomPage.tsx`
The router/dispatcher for room content. Fetches the room from `GET /api/rooms/:roomId` (falls back to `POST /api/rooms/:roomId/join` if not already a member). Then renders the appropriate layout based on `room.mode` and `room.interviewType`:

| Mode | Interview Type | Rendered Component |
|---|---|---|
| `'collaboration'` | — | `CollaborationProvider` + `StreamRoomProvider` + `CollaborativeEditor` |
| `'interview'` | `'normal'` | `CollaborationProvider` + `StreamRoomProvider` + `NormalInterviewLayout` |
| `'interview'` | `'ai'` | `AIInterviewContainer` |
| `'practice'` | — | `PracticeRoomContainer` |

Always renders `RoomFullscreenButton` and `RoomCopyLinkButton` as floating overlays.
Listens for `roomProblemUpdated` window event (dispatched by AI Problem Builder) to re-fetch the room.

#### `PracticeRoomContainer.tsx`
Fetches the problem for the room from `GET /api/problems/:problemId`. Passes it into `<PracticeLayout>`.

#### `AIInterviewContainer.tsx`
Fetches or initializes the AI interview session (`GET /api/ai-interviews/session/:roomId`). Renders `<AIInterviewSetup>` if no session exists, otherwise renders `<AIInterviewLayout>`.

#### `CommunityPage.tsx`
Large page with multiple sections:
- **User search** with debounced search input calling `GET /api/community/users?search=...`.
- **User cards** showing name, username, avatar, bio, join date.
- **Friend requests** — send/accept/reject.
- **Community stats** — total users, rooms, problems solved.
- **Community events** listing.
- **Discussions** listing.

#### `ProfilePage.tsx`
Shows the current user's profile. Allows editing name, bio, avatar URL. Calls `PUT /api/users/profile`. Also shows stats like rooms created, practice attempts, etc.

#### `NotFoundPage.tsx`
A styled 404 page with a "Back to Dashboard" button.

### Collaboration Layer

All files live in `apps/client/src/collaboration/`.

#### `CollaborationProvider.tsx`
React context provider that sets up the Yjs + WebSocket connection for a room:
1. Creates a `Y.Doc` instance.
2. Creates a `WebsocketProvider` (from `y-websocket`) pointing to `ws(s)://<server>/collaboration/<roomId>`. The JWT cookie is sent automatically by the browser on the WebSocket upgrade.
3. Tracks connection `status`: `'connecting' | 'connected' | 'disconnected' | 'error'`.
4. Exposes `{ doc, provider, status }` via the `CollaborationContext`.

#### `useCollaboration.ts`
Custom hooks built on top of the `CollaborationContext`:
- `useSharedState<T>(key, defaultValue)` — reads and writes a value to `ydoc.getMap('metadata')`. Returns `[value, setValue]` pair. Subscribes to Yjs map changes to re-render on updates from other clients.
- `useSelfInfo()` — reads/writes the current user's awareness info (name, color) to the Yjs awareness protocol, enabling cursor presence.

#### `types.ts`
TypeScript types for the collaboration context shape.

### Components

#### Global Components

**`Navbar.tsx`** — Top navigation bar shown on all non-room pages. Contains:
- DevMeet logo (links to `/`).
- Navigation links: Dashboard, Community.
- Theme toggle button (moon/sun icon).
- User avatar with dropdown (profile, logout).
- Mobile menu button (hamburger icon, hidden on desktop via CSS).

**`DevMeetLogo.tsx`** — The SVG logo component rendered in the navbar and landing page.

**`ErrorBoundary.tsx`** — Class-based React error boundary. Wraps the entire `<App>`. Catches render errors and shows a styled "Something went wrong" fallback UI with a "Refresh Page" button and the error message.

**`SignupForm.tsx`** — Multi-step signup form:
1. Collects name, email, optional username.
2. Submits to `POST /api/auth/signup`.
3. On success, navigates to `/verify?username=<username>`.
- Includes links to Google OAuth (`/api/auth/google`) and GitHub OAuth (`/api/auth/github`).
- Real-time validation with error display.

**`login-form.tsx`** — Login form with identifier (email or username) + password inputs. Calls `POST /api/auth/login`. On success, navigates to `/dashboard`. Includes links to Google and GitHub OAuth.

**`RoomCopyLinkButton.tsx`** — A floating "Copy Link" button fixed at top-right of the viewport inside a room. Copies `window.location.href` to clipboard and shows a toast.

**`RoomFullscreenButton.tsx`** — A floating fullscreen toggle button fixed at top-left of a room. Uses the `document.fullscreenElement` API. Shows a fullscreen enter/exit icon.

**`auth.css`** — Styles specific to the login and signup forms (background gradients, card layout).

#### Editor

**`CollaborativeEditor.tsx`** — The core collaborative code editor. This is the most complex client-side component. See the [Architecture section](#4-architecture--data-flow) for the execution data flow.

Key features:
- Binds Monaco Editor to the Yjs `ydoc.getText('codemirror')` using `MonacoBinding`.
- Uses `useSharedState` for `language`, `output`, and `input` — all shared across users in real-time.
- Custom Monaco theme `'devmeet-dark'` (dark background `#0d0f14`, green line numbers).
- Resizable vertical split between the editor and the output/input terminal using `react-resizable-panels`.
- The terminal area toggles between:
  - **Input mode** — a `<textarea>` for stdin (shared via Yjs).
  - **Output mode** — a `<pre>` showing the last execution result.
- An observer on `ydoc.getMap('metadata')` watches for `lastExecution` key changes and updates the output display.
- Run button calls `executionService.runCode()` → `POST /api/execution/run`. The result arrives asynchronously via the Yjs observer.
- The `AIProblemBuilderButton` is embedded in the editor header.

**`CollaborativeEditor.module.css`** — CSS module for the editor's layout (container, editor header, left pane, split container, panel group, code panel, output panel, resize handle, etc.)

#### Room Structure

**`StreamRoomProvider.tsx`** — Wraps the room content with Stream Video. Manages the entire lifecycle:
1. Fetches the Stream token from `GET /api/stream/token/:roomId`.
2. Creates `StreamVideoClient` with the user's details.
3. Creates a `call('default', roomId)` instance.
4. Renders a **pre-join lobby** (`PreJoinLobby` sub-component) before joining the call. The lobby shows a live camera preview (or "CAMERA OFF" placeholder) and mic/camera toggle buttons.
5. On "Join Room" click, calls `call.join({ create: true })`.
6. After joining, renders a **resizable horizontal split** (80/20 by default): left pane has `{children}` (the editor or interview layout), right pane has `<PaginatedGridLayout />` (video tiles) + `<CallControls />` (mic, camera, screen share, leave buttons).
7. `CallEventNotifier` sub-component listens to Stream call events and shows Sonner toasts when participants join or leave.

**`Toolbar.tsx`** — A language selector dropdown component. Renders a `<select>` element populated from `SUPPORTED_LANGUAGES`. Calls `onLanguageChange(newLanguage)` when changed.

**`toolbar.css`** — Styles for the toolbar's select dropdown and surrounding layout.

#### AI Problem Builder

The AI Problem Builder is a modal-based tool accessible from inside any room that lets users generate a full coding problem using AI and assign it to the room.

**`AIProblemBuilderButton.tsx`** — A trigger button (sparkles icon + "AI Problem" label). Opens the `AIProblemBuilderModal`. Accepts `{ roomId, mode, compact }` props. In `compact` mode, it renders as a smaller icon-only button.

**`AIProblemBuilderModal.tsx`** — The full modal UI. Contains a 4-tab interface:
- **Topic** — enter a topic (e.g., "Binary Trees"), difficulty, and tags. Calls `POST /api/ai-problems/generate/topic`.
- **Prompt** — free-form natural language description of the problem. Calls `POST /api/ai-problems/generate/prompt`.
- **Paste** — paste an existing problem statement; AI parses and structures it. Calls `POST /api/ai-problems/generate/paste`.
- **LeetCode Style** — enter a LeetCode problem number/title/URL; AI generates an original similar problem. Calls `POST /api/ai-problems/generate/leetcode-style`.

After generation, shows the `AIProblemPreview`. On "Assign to Room", calls `POST /api/ai-problems/assign`, dispatches the `roomProblemUpdated` window event, and closes the modal.

**`AIProblemMethodSelector.tsx`** — The tab bar component for selecting the generation method inside the modal.

**`AIProblemPreview.tsx`** — Displays the generated problem in a read-only preview: title, difficulty badge, description (rendered as formatted text), examples, constraints, and tags. Also shows the generated test case count.

#### AI Interview

Handles the AI-powered interview mode where Google Gemini acts as the technical interviewer.

**`AIInterviewSetup.tsx`** — Configuration screen shown before starting the AI interview. Lets the user set the problem, duration, and difficulty. Calls `POST /api/ai-interviews/session` to initialize the session.

**`AIInterviewLayout.tsx`** — The main AI interview interface. Full-page layout with three columns:
1. **Problem panel** (left) — displays the problem statement.
2. **Code editor** (center) — `AIInterviewEditor` for writing code.
3. **Chat panel** (right) — `AIChatPanel` for conversing with the AI interviewer.

Controls at the top: timer countdown, hint request button, code review button, submit button (triggers final evaluation).

**`AIInterviewEditor.tsx`** — A Monaco editor configured for the AI interview. Supports language selection (JavaScript, Python, C++). Has a "Run Code" button that submits to `POST /api/execution/run` (standard execution pipeline). Displays the output. When the user requests code review, sends current code to `POST /api/ai-interviews/review`.

**`AIChatPanel.tsx`** — The conversational chat UI. Renders a list of `AIMessageBubble` components. Has a text input to send messages to the AI interviewer (`POST /api/ai-interviews/message`).

**`AIMessageBubble.tsx`** — Renders a single chat message. Differentiates between `user` and `assistant` roles with different styling. Shows message type badges (hint, code review, evaluation).

**`AIReportPanel.tsx`** — Displayed after the AI interview is complete. Shows the structured evaluation report: radar chart of scores (correctness, approach, complexity, code quality, communication), summary, strengths list, weaknesses list, suggestions, and time/space complexity.

#### Normal Interview

Handles peer-to-peer mock interviews with real-time video, a shared code editor, problem display, and a structured flow.

**`NormalInterviewLayout.tsx`** — The complete layout for a normal (peer) interview room. A complex multi-pane UI:
- Fetches or creates the `InterviewSession` via `GET /api/interviews/:roomId/session`.
- Determines user role (interviewer / candidate / viewer) from `interviewParticipants`.
- **Left pane:** `InterviewProblemPanel` (problem display) or `InterviewProblemSelector` (problem picker for interviewer).
- **Center pane:** `InterviewEditor` (the shared Monaco editor) + `SubmissionResultPanel`.
- **Right pane:** participant video tiles (Stream Video `PaginatedGridLayout`) + `CallControls`.
- **Top bar:** room info, `InterviewTimer`, role badges, interviewer actions (notes, end interview), candidate actions (submit).
- Manages the session lifecycle: start → active → end.

**`InterviewEditor.tsx`** — Monaco editor for the interview candidate. Bound to Yjs for real-time sync. The interviewer can see and follow the candidate's typing live. Includes language selector and a "Run Code" button.

**`InterviewProblemPanel.tsx`** — Displays the selected problem statement, examples, constraints. Uses markdown-style rendering for the description. Shows difficulty badge and tags.

**`InterviewProblemSelector.tsx`** — Shown to the interviewer to pick a problem. Lists all problems from `GET /api/problems`. Allows the interviewer to set the problem for the room via `PATCH /api/rooms/:roomId/problem`.

**`InterviewTimer.tsx`** — Countdown timer component. Shows `MM:SS` format. Turns red when under 5 minutes. Fires a callback when time expires.

**`InterviewControls.tsx`** — Control bar buttons for the interview (start timer, end interview, request evaluation).

**`InterviewReportModal.tsx`** — Modal showing the final interview report after the session ends. Displays submission results, test case pass/fail breakdown, and overall score.

**`InterviewerNotesModal.tsx`** — A modal for the interviewer to write private notes about the candidate during the interview. Notes are saved to the `InterviewSession` document.

**`SubmissionResultPanel.tsx`** — Panel at the bottom of the editor showing the test case results for the latest submission. Shows pass/fail per test case, execution time, and overall score.

#### Practice Mode

Handles the solo practice mode where users solve problems alone with full test case evaluation.

**`PracticeLayout.tsx`** — Main practice room layout. A resizable two-column split:
- Left: `ProblemPanel` (problem display) + `AttemptHistory` tab.
- Right: `PracticeEditor` (code editor + run controls).

**`PracticeEditor.tsx`** — Monaco editor for practice mode. Unlike the collaborative editor, this is purely local (not Yjs-bound). Language selector, Run Code button (calls `POST /api/execution/run`), and Submit button (calls `POST /api/practice/submit` which evaluates against all test cases). Displays output in a terminal panel.

**`ProblemPanel.tsx`** — Renders the problem statement, examples, constraints, and difficulty badge. Has tabs for Problem / Test Cases.

**`ProblemSelector.tsx`** — Shown when the practice room has no problem assigned. Lists all problems and lets the user pick one via `PATCH /api/rooms/:roomId/problem`.

**`AttemptHistory.tsx`** — Shows previous attempts for this practice room. Fetches from `GET /api/practice/attempts/:roomId`. Each attempt shows: language, status (passed/failed/partial), pass count, date.

#### Room Utilities

**`RoomModeBadge.tsx`** — A small badge showing the room's mode (`Collab / Practice / Interview`) and interview type (`Peer / AI`). Used on room cards in the dashboard.

**`RoomModeSelector.tsx`** — (Used internally by CreateRoomPage) — the three option cards for selecting collaboration/practice/interview mode.

**`InterviewRoomPlaceholder.tsx`** — Shown for interview rooms where the interview type isn't set or isn't supported. Displays the room info and a message.

**`PracticeRoomPlaceholder.tsx`** — Shown for practice rooms before a problem is assigned.

#### UI Primitives

Located in `apps/client/src/components/ui/`:

**`LoadingSpinner.tsx`** — A centered spinner component. Accepts `{ fullScreen, message }` props. In `fullScreen` mode, fills the entire viewport with a dark background and shows the message below the spinner.

### Client Services

All services live in `apps/client/src/services/` and wrap API calls using the Axios instance from `api.ts`.

**`api.ts`** — Creates and exports an Axios instance with `baseURL` set to the Vite env var `VITE_API_URL` (or empty string for same-origin). Sets `withCredentials: true` so the JWT cookie is sent on every request. Adds a response interceptor that redirects to `/login` on 401 errors.

**`authService.ts`** — Wraps auth endpoints: `login()`, `signup()`, `completeSignup()`, `logout()`, `forgotPassword()`, `resetPassword()`, `verifyOtp()`, `getMe()`.

**`roomService.ts`** — `createRoom()`, `getRooms()`, `getRoom()`, `joinRoom()`, `deleteRoom()`, `updateRoomProblem()`.

**`executionService.ts`** — `runCode({ code, languageId, roomId, stdin })` → `POST /api/execution/run`. Exports `TERMINAL_STATUSES` — a set of statuses that mean execution is complete.

**`streamService.ts`** — `getStreamToken(roomId)` → `GET /api/stream/token/:roomId`. Returns `{ token, apiKey }`.

**`problemService.ts`** — `getProblems()`, `getProblem(id)`.

**`practiceService.ts`** — `submitCode(payload)`, `getAttempts(roomId)`.

**`interviewService.ts`** — `createSession()`, `getSession(roomId)`, `startSession(roomId)`, `endSession(roomId)`, `submitCode(payload)`.

**`aiInterviewService.ts`** — `initSession()`, `sendMessage()`, `requestHint()`, `requestReview()`, `requestEvaluation()`, `getSession(roomId)`.

**`aiProblemService.ts`** — `generateFromTopic()`, `generateFromPrompt()`, `generateFromPaste()`, `generateLeetCodeStyle()`, `generateTestCases()`, `assignToRoom()`.

**`testCaseService.ts`** — `generateTestCases(problemId, options)` → calls the AI test case generation endpoint.

### Design System (`index.css`)

DevMeet uses a custom **brutalist design language** with a complete CSS custom properties (variables) system.

#### Theme Tokens (Dark Mode Default)

| Token | Value | Usage |
|---|---|---|
| `--dm-bg` | `#0a0a0a` | Page background |
| `--dm-card` | `#111111` | Card backgrounds |
| `--dm-input` | `#000000` | Input backgrounds |
| `--dm-surface` | `#1a1a1a` | Elevated surface (popovers, sidebars) |
| `--dm-border` | `#404040` | Default borders |
| `--dm-border2` | `#555555` | Secondary borders |
| `--dm-muted` | `#a3a3a3` | Muted/secondary text |
| `--dm-text` | `#fafafa` | Primary text |
| `--dm-accent` | `#facc15` | Primary accent (yellow) |
| `--dm-accent-dim` | `rgba(250,204,21,0.15)` | Dimmed accent for backgrounds |
| `--dm-radius` | `0px` | Border radius (sharp/brutalist) |
| `--dm-transition` | `all 0.15s ease-out` | Default transition |

Light mode overrides applied via `[data-theme="light"]` selector.

#### Key CSS Classes

| Class | Description |
|---|---|
| `.dm-card` | Brutalist card with 4px border and offset box-shadow. Hover: translates -2px/-2px, yellow shadow. |
| `.dm-glass` | Same as card but without hover effect. |
| `.dm-btn-primary` | Yellow (`--dm-accent`) button, JetBrains Mono font, uppercase. Hover: black with yellow border. |
| `.dm-btn-ghost` | Transparent button with border. Hover: white fill, black text. |
| `.dm-btn-danger` | Red (`#ef4444`) button. Hover: black with red border. |
| `.dm-input` | Dark input with yellow focus ring and offset shadow. |
| `.dm-label` | Uppercase JetBrains Mono label. |
| `.dm-badge` | Yellow badge pill. |
| `.dm-error-box` | Red-bordered error message box. |
| `.dm-grid-2/3/4` | Responsive CSS grid utilities. |
| `.page-wrapper` | Max-width 1300px centered page container. |
| `.animate-fade-in` | Fade in animation (0.2s). |
| `.animate-slide-up` | Slide up + fade in animation (0.3s). |
| `.my-theme` | Stream Video SDK theme overrides (all Stream components match the brutalist aesthetic). |
| `.nsoc-sidebar` | Expandable sidebar with hover-to-open behavior. |
| `.room-card-hover` | Room card accent hover (yellow border + translate). |
| `.nsoc-icon-btn` | Icon button hover style. |
| `.nsoc-mobile-btn` | Mobile-only hamburger button (hidden on desktop). |

The global background has a subtle grid texture via CSS gradients (`3% opacity, 60px × 60px`).

---

## 9. Deployment

### Docker Compose (Development)

`docker-compose.yml` defines 5 services:

| Service | What it runs |
|---|---|
| `client` | Vite production build served statically |
| `server` | Express server on port 5000 |
| `worker` | BullMQ worker with Docker socket access |
| `redis` | Redis 7 Alpine with persistent volume |
| `nginx` | Nginx reverse proxy on ports 80/443 |

The `worker` service has two critical volume mounts:
- `/var/run/docker.sock:/var/run/docker.sock` — allows the worker process to issue `docker exec` commands on the host Docker daemon.
- `/tmp:/tmp` — the shared working directory for code files between the worker and spawned containers.

All services are connected via a `devmeet_net` bridge network.

### Docker Compose (Production)

`docker-compose.prod.yml` — similar to dev but with additional production hardening (e.g., stricter resource limits, production environment variables).

### Nginx Reverse Proxy

`nginx.conf` routes traffic:
- `GET /` and all non-API paths → `client` service (Vite static files).
- `GET /api/*` → `server:5000` (REST API).
- `GET /collaboration/*` → `server:5000` with WebSocket upgrade support (`proxy_set_header Upgrade`, `Connection "upgrade"`).

---

## 10. Environment Variables

Copy `.env.example` to:
- `apps/server/.env`
- `apps/worker/.env`
- `apps/client/.env` (only `VITE_*` vars)

| Variable | Required By | Description |
|---|---|---|
| `MONGODB_URI` | server, worker | Full MongoDB connection string |
| `JWT_SECRET` | server | Secret for signing JWT tokens (use `openssl rand -base64 32`) |
| `STREAM_VIDEO_API_KEY` | server, client | Get Stream API key from getstream.io |
| `STREAM_VIDEO_API_SECRET` | server | Stream API secret (server-only) |
| `VITE_STREAM_VIDEO_API_KEY` | client | Same key, Vite-exposed for SDK initialization |
| `REDIS_URL` | server, worker | Redis connection URL (e.g., `redis://localhost:6379`) |
| `RATE_LIMIT_ENABLED` | server | Enable/disable rate limiting (`true`/`false`) |
| `RESEND_API_KEY` | server | Resend API key for sending emails |
| `EMAIL_FROM` | server | Sender email address (must be verified in Resend) |
| `GEMINI_API_KEY` | server | Google Gemini API key for AI features |
| `GOOGLE_CLIENT_ID` | server | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | server | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | server | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | server | GitHub OAuth app client secret |
| `CLIENT_URL` | server | Full URL of the frontend (e.g., `https://devmeet.example.com`) |
| `PORT` | server | Server port (default: 5000) |
| `BCRYPT_SALT_ROUNDS` | server | bcrypt rounds (default: 12) |
| `EXECUTION_PROVIDER` | worker | Always `'docker'` |
| `EXECUTION_TIMEOUT_MS` | worker | Max run time per execution (default: 5000ms) |
| `EXECUTION_MEMORY_MB` | worker | Memory limit for containers (default: 128) |
| `EXECUTION_MAX_CODE_SIZE_KB` | worker | Max code size (default: 64KB) |
| `EXECUTION_MAX_STDIN_SIZE_KB` | worker | Max stdin size (default: 16KB) |
| `EXECUTION_MAX_OUTPUT_SIZE_KB` | worker | Max stdout/stderr size (default: 64KB) |
| `VITE_API_URL` | client | API base URL (empty string for same-origin, or full URL for cross-origin) |

---

## 11. Running Locally (Dev Mode)

### Prerequisites
- Node.js 18+
- npm 9+
- Docker Desktop (required for the code execution worker)
- Redis (can use `docker run -d -p 6379:6379 redis:7-alpine`)
- MongoDB Atlas account or local MongoDB instance

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd DEVMEET
npm install

# 2. Set up environment variables
# Create apps/server/.env and apps/worker/.env from .env.example
# Create apps/client/.env with VITE_API_URL and VITE_STREAM_VIDEO_API_KEY

# 3. Start everything (server + client)
npm run dev

# 4. In a separate terminal, start the worker
npm run dev:worker
```

- Client runs at: `http://localhost:5173`
- Server runs at: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

> **Note:** The code execution worker requires Docker to be running. Without it, the "Run" button in rooms will queue jobs that never complete.

### Build for Production

```bash
# Build all packages in dependency order
npm run build

# Or build individually
npm run build:client
npm run build:server
npm run build:worker
```

---

## 12. API Reference

All API responses follow this consistent envelope:

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

### Standard Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | No token provided |
| `TOKEN_INVALID` | 401 | Token expired or invalid |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `EMAIL_TAKEN` | 409 | Email already registered |
| `USERNAME_TAKEN` | 409 | Username already taken |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `NOT_VERIFIED` | 403 | Account not email-verified |
| `CODE_EXPIRED` | 400 | OTP has expired |
| `CODE_INVALID` | 400 | Wrong OTP |
| `UNSUPPORTED_LANGUAGE` | 400 | Language not supported for execution |
| `CODE_TOO_LARGE` | 400 | Code exceeds 50KB |
| `RATE_LIMITED` | 429 | Too many requests |
