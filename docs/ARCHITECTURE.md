# DevMeet Architecture

## High-Level Overview

DevMeet is a real-time collaborative coding platform. The architecture has evolved from a Next.js monolith to a decoupled React+Vite frontend, an Express Node.js backend, and a dedicated BullMQ/Docker worker.

### Components

#### Frontend: `apps/client`
- **Framework**: React + Vite
- **Language**: TypeScript
- **State Management**: React Context, custom hooks.
- **Editor**: Monaco Editor with `y-monaco` binding for Yjs collaborative editing.
- **Routing**: `react-router-dom`

#### Backend: `apps/server`
- **Framework**: Express (Node.js)
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Cache & Rate Limiting**: Redis (via ioredis)
- **Authentication**: JWT stored in `httpOnly` cookies.
- **Collaboration**: Custom y-websocket server attached to the Express HTTP server.

#### Worker: `apps/worker`
- **Framework**: Node.js + BullMQ
- **Language**: TypeScript
- **Execution**: Docker-based sandbox (`docker exec` into persistent containers)
- **Queue**: Redis-backed BullMQ job queue

### System Flow & Integrations

```
React Client
  ↓ REST API (http://localhost:5000/api)
Node Express Server
  ↓ Redis Rate Limiter
Controllers
  ↓
MongoDB (User data, Room metadata)
```

```
React Client
  ↓ WebSocket (ws://localhost:5000/collaboration/:roomId)
Node WebSocket Collaboration Server
  ↓ Redis Rate Limit Check
Yjs Room Documents (y-websocket)
  ↓
MongoDB Snapshots (CollaborationDocument)
```

```
React Client
  ↓ POST /api/execution/run
Express API
  ↓ MongoDB ExecutionJob (status: queued)
  ↓ BullMQ Queue
  ↓ Redis
  ↓ Worker (apps/worker)
  ↓ Docker Sandbox (persistent container via docker exec)
  ↓ MongoDB ExecutionJob (status: completed/failed/timeout)
  ↓ Client polls GET /api/execution/jobs/:jobId
```

### 7. Code Execution & Background Workers
The execution system uses BullMQ and Docker for secure, isolated code execution.

**Execution Flow (Collaboration/Practice/Interview Run):**
1. Client sends code via POST `/api/execution/run` (or `/api/interviews/:id/run`).
2. Server adds an `ExecutionJob` to the `code-execution` Redis queue.
3. Worker picks up the job and spins up an isolated Docker container for the specific language.
4. Code runs against single `stdin` (if provided).
5. Result is published back to a Redis pub/sub channel (`room:execution:${roomId}`).
6. The `CollaborationProvider` listens via Yjs metadata sync and pushes the output to clients in real-time.

**Interview Submission Flow:**
1. Client submits solution via POST `/api/interviews/:id/submit`.
2. Server creates an `InterviewSubmission` record (`status: 'queued'`).
3. Server pushes a payload to `interview-submission` BullMQ queue with all test cases (visible + hidden).
4. Worker iterates through test cases sequentially in Docker, comparing stdout to `expectedOutput`.
5. Worker updates `InterviewSubmission` with final result (`accepted`, `wrong_answer`, `timeout`, `compile_error`), passed/failed count, and hidden summary.
6. Worker publishes completion via Redis pub/sub to notify clients.
7. Client UI polls/displays results via `SubmissionResultPanel`.

### Room Modes

DevMeet supports three distinct product workflows within rooms:
- **Collaboration Mode**: The default mode. Real-time collaborative coding with a shared editor, synchronized code execution, and group video conferencing.
- **Practice Mode**: A solo environment intended for individual practice. Features the code editor and an upcoming problem statement panel, but disables video conferencing and collaboration.
- **Interview Mode**: A structured technical interview environment. Users can choose between a **Normal Interview** (with a real interviewer) or an **AI Interview** (an automated session driven by an AI agent). Full workflows and problem integrations for interviews are scheduled for future phases.

#### External Services
- **MongoDB**: Primary persistent data store.
- **Redis**: Distributed rate limiting, BullMQ job queue, and short-lived caching.
- **Stream Video**: Used for real-time video and audio calls within rooms.
- **Resend**: Used for transactional emails (OTP verification).

### Data Modeling (Interview Mode)
- `Room`: Core collaboration unit (mode: `collaboration` | `practice` | `interview`)
- `InterviewSession`: Tracks status, timer, interviewer, and candidate for an interview room.
- `InterviewEvent`: Event log for interview lifecycle (start, end, run, submit).
- `InterviewSubmission`: Batch evaluation record with test results (visible and hidden tests).
- `PracticeAttempt`: Used for Practice Mode offline saves.

### Real-Time Collaboration
The collaborative editing experience is powered by **Yjs** and a custom WebSocket server.
1. WebSockets connect and authenticate using the same `httpOnly` JWT cookie as REST requests.
2. The server manages a `Y.Doc` per active room.
3. Code changes and metadata (selected language, terminal inputs/outputs) sync across all participants via Yjs `y-websocket` protocol.
4. When the last participant leaves a room, the `Y.Doc` state is serialized and persisted to MongoDB.

### Future Roadmap
- **More Language Support**: Add Java, Go, Rust, Ruby, PHP using custom minimal Docker images.
- **WebSocket Push for Job Results**: Instead of client polling, push job completion events over the existing Yjs WebSocket so all room participants instantly see output.
- **Stronger Isolation**: Explore gVisor or Firecracker VM for production-grade sandboxing.

> **TODO**: Redis cluster mode for horizontal WebSocket scaling (currently single-node).
