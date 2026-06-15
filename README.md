# DevMeet - Real-Time Collaborative Coding Platform

This document explains **everything** about DevMeet — from the basic concepts behind real-time collaboration to the complete system architecture, including our Docker-based secure code execution sandbox and BullMQ job queues. After reading this, you should understand exactly how data flows through the system.

> **Looking for instructions on how to run the project?**
> Please see [RUN_DEVMEET.md](./RUN_DEVMEET.md) for detailed step-by-step instructions on local development and Docker deployment.

---

## Table of Contents

1. [What is DevMeet?](#1-what-is-devmeet)
2. [Background Concepts](#2-background-concepts)
3. [Project Architecture Overview](#3-project-architecture-overview)
4. [The User Journey: Step by Step](#4-the-user-journey-step-by-step)
5. [Deep Dive: Authentication System](#5-deep-dive-authentication-system)
6. [Deep Dive: Real-Time Collaborative Editor](#6-deep-dive-real-time-collaborative-editor)
7. [Deep Dive: Video Conferencing](#7-deep-dive-video-conferencing)
8. [Deep Dive: Asynchronous Job Queues (Redis + BullMQ)](#8-deep-dive-asynchronous-job-queues-redis--bullmq)
9. [Deep Dive: Sandboxed Code Execution (Docker)](#9-deep-dive-sandboxed-code-execution-docker)
10. [Deep Dive: Generative AI Integration (Google Gemini)](#10-deep-dive-generative-ai-integration-google-gemini)
11. [Security Architecture](#11-security-architecture)
12. [Understanding the Tech Stack](#12-understanding-the-tech-stack)

---

## 1. What is DevMeet?

**DevMeet** is a browser-based collaborative space where friends and small teams can jump on a video call and write, compile, and run code together in real time — no setup, no plugins, no screen sharing hacks.

### Real-World Use Cases:
- **Group Study Sessions**: Friends preparing for coding interviews can write, run, and debug code together while on a call.
- **Virtual Technical Interviews**: Interviewers can observe candidates' live typing, thought process, and code output in one place.
- **Lightweight Team Collaboration**: Small teams can review code or pair program without needing heavy tools like Zoom + VS Code Live Share.

---

## 2. Background Concepts

Before explaining how DevMeet works, it helps to understand a few key concepts it relies on.

### What is a CRDT?

**CRDT (Conflict-free Replicated Data Type)** is the algorithm that handles what happens when two people type on the **same line at the same time**. DevMeet uses **Yjs** for this.

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

### What is WebRTC?

**WebRTC** allows video/audio to stream directly between clients. DevMeet uses an **SFU (Selective Forwarding Unit)** via Stream Video to route these streams efficiently without killing your internet bandwidth.

### Message Queues & Workers

For heavy tasks (like compiling C++ code), doing it on the main API server would freeze it for everyone else. Instead, the server puts the task on a **Queue** (in Redis). A separate background **Worker** picks it up, runs it, and saves the result. This keeps the API lightning fast.

---

## 3. Project Architecture Overview

DevMeet is built as a **Monorepo** (using `npm workspaces`) with three main services working together. The entire stack is written in **TypeScript** to ensure end-to-end type safety, from frontend components to backend API interfaces and worker jobs:

```text
┌─────────────────────────────────────────────────────────────┐
│                          DEVMEET                            │
├──────────────────┬──────────────────────┬───────────────────┤
│    Frontend      │       Backend        │      Worker       │
│  (React/Vite)    │  (Express Server)    │ (Node.js/BullMQ)  │
│                  │                      │                   │
│ - Monaco Editor  │ - Auth & JWT         │ - Reads from Q    │
│ - Stream Video   │ - REST API           │ - Spawns Docker   │
│ - Yjs WebSocket  │ - Pushes to Queue    │ - Executes Code   │
└────────┬─────────┴──────────┬───────────┴─────────┬─────────┘
         │                    │                     │
         ▼                    ▼                     ▼
  ┌──────────────┐    ┌───────────────┐     ┌───────────────┐
  │  y-websocket │    │ MongoDB Atlas │     │ Redis Queue   │
  │  (Custom WS) │    │  (Database)   │     │ (BullMQ Data) │
  └──────────────┘    └───────────────┘     └───────────────┘
```

---

## 4. The User Journey: Step by Step

Let's trace a user from opening the browser to collaborating inside a room.

### Step 1: Sign Up & OTP
User clicks "Sign Up". The server hashes their password with `bcrypt` (12 rounds) and saves it to MongoDB. An OTP email is sent via Resend API. The user enters the OTP to verify their account.

### Step 2: Login & JWT Session
```text
Browser                     Express Server                   MongoDB
   │                               │                              │
   │── POST { email, password } ──►│                              │
   │                               │── Find user & check hash ───►│
   │                               │── Signs JWT:                 │
   │                               │   { userId, name }           │
   │◄── Set-Cookie: token ─────────│                              │
   │    (HTTP-only, Secure)        │                              │
   (Redirected to /dashboard)
```
Every future request includes this JWT automatically. The server verifies it locally without querying the database, making auth incredibly fast.

### Step 3: Social & Dashboard
Users land on the Dashboard where they can:
- **Pin Rooms** for quick access.
- See **Recent Activity** and **Online Friends**.
- Update their **Profile** (Avatar, Bio, Display Name).
- Connect with other developers via the **Community** and **Friends** systems.

### Step 4: Entering the Room — Connection Setup
Before the frontend can connect to Stream (video), it fetches a short-lived access token from our Express backend. Master API keys **never** leave the server. For real-time text collaboration, the client opens a WebSocket connection to our custom y-websocket server, which authenticates using the same HTTP-only JWT cookie.

---

## 5. Deep Dive: Authentication System

DevMeet uses **HTTP-only JWT cookies**, not database sessions.

| Concept | How it works | Why we chose it |
|---------|--------------|-----------------|
| **JWT** | Signed JSON payload inside a cookie | Zero DB reads to verify a user's identity. Highly scalable. |
| **HTTP-Only** | JS cannot access the cookie (`document.cookie`) | Immune to XSS (Cross-Site Scripting) attacks stealing tokens. |
| **Bcrypt 12** | Hashing algorithm with a salt | Protects passwords even if the database is leaked. 12 rounds takes ~400ms. |

---

## 6. Deep Dive: Real-Time Collaborative Editor

```text
Monaco Editor       Yjs                  Custom y-websocket Server
(The text editor)   (The CRDT engine)    (The network layer)
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

Live cursor positions are **not** part of the Yjs document to keep network load small. They are broadcasted separately via Yjs **Awareness** protocol over the same WebSocket connection.

---

## 7. Deep Dive: Video Conferencing

We use an **SFU (Selective Forwarding Unit)** architecture via Stream Video. 

```text
Peer-to-Peer Mesh (BAD for 5 users):
User A ──► B, C, D, E   (4 uploads) = Internet crash

SFU (GOOD for 5 users):
User A ──► SFU Server ──► B, C, D, E   (1 upload) = Efficient!
```

---

## 8. Deep Dive: Asynchronous Job Queues (Redis + BullMQ)

When a user clicks "Run Code", we cannot block the main Express server while C++ compiles. We use an asynchronous job queue powered by **Redis** and **BullMQ**.

### The Queueing Flow with WebSocket Push

Unlike typical apps that use HTTP polling, DevMeet uses instantaneous WebSocket pushes integrated directly into the Yjs collaboration document!

```text
 1. Client Click     2. API Server         3. Redis           4. Worker Process
 ┌────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────────────┐
 │            │    │              │    │             │    │                    │
 │ Run Code!  ├───►│ POST /run    ├───►│ BullMQ List ├───►│ Picks up Job       │
 │            │    │ Returns 202  │    │ [Job 123]   │    │ Reads Code         │
 └────────────┘    └──────────────┘    └─────────────┘    │ Runs in Docker     │
                                                          │ Publishes to Redis │
 5. Server observes ◄──────────────────◄──────────────────┤ Marks as DONE      │
    PubSub, pushes to                                     └────────────────────┘
    Yjs Metadata Map

 6. Client reacts to Yjs state change instantly (Zero polling overhead)
```

---

## 9. Deep Dive: Sandboxed Code Execution (Docker)

Running untrusted user code is the most dangerous part of DevMeet. If we ran it directly on our servers, users could execute `rm -rf /` or run crypto-miners.

To prevent this, our Worker process executes all code inside **isolated, highly restricted Docker containers**.

### Sandbox Architecture

We use a "Persistent Container" architecture for speed. Instead of spinning up a fresh container for every execution (which takes 2-3 seconds), we keep one container running per language and execute code *inside* it via `docker exec`.

```text
                         ┌──────────────────────────────────────────────┐
                         │   Docker Daemon (Host OS)                    │
                         │                                              │
                         │   ┌─────────────────────────────────────┐    │
┌──────────────┐         │   │ gcc:latest Container (Sandboxed)    │    │
│              │         │   │                                     │    │
│ Worker       │ write   │   │  /tmp (tmpfs in RAM, noexec)        │    │
│ Process      ├─────────┼──►│  /sandbox/run-123/main.cpp          │    │
│ (Node.js)    │ execute │   │                                     │    │
│              ├─────────┼──►│  g++ main.cpp                       │    │
│              │ read    │   │  ./main < stdin.txt                 │    │
└──────────────┘         │   │                                     │    │
                         │   └─────────────────────────────────────┘    │
                         └──────────────────────────────────────────────┘
```

### Extreme Security Hardening

Our containers are fortified with multiple security layers:

| Docker Flag | Security Purpose |
|-------------|------------------|
| `--network none` | Completely disables internet access inside the container. Code cannot download malware or act as part of a botnet. |
| `--memory 128m` | Prevents RAM exhaustion (OOM crashes) from malicious code allocating massive arrays. |
| `--cpus 1.0` | Prevents CPU hogging. Infinite loops will only consume 1 core, leaving the rest of the host machine fine. |
| `--pids-limit 128` | Prevents **Fork Bombs** (`while(1) fork();`). The code can only spawn a maximum of 128 processes. |
| `--user 65534` | Runs code as the `nobody` user. Even inside the sandbox, the code does not have root privileges. |
| `--cap-drop ALL` | Drops every Linux kernel capability (e.g., `CAP_NET_RAW`, `CAP_SYS_ADMIN`). |
| `--read-only` | The root filesystem `/` is completely read-only. Code cannot modify system binaries. |
| `--tmpfs /tmp:rw` | Provides a temporary, RAM-based writable folder for compilation artifacts. |

### Compilation Timeouts
Compiled languages like C++ get separate `compileTimeoutMs` (e.g., 30s) and `timeoutMs` (e.g., 10s) to allow for slow cold-starts without giving running programs too much time to execute.

---

## 10. Deep Dive: Generative AI Integration (Google Gemini)

DevMeet leverages the **Google Generative AI SDK (Gemini)** to power intelligent features on the platform. We utilize advanced models (like Gemini 2.5) to interact with users and evaluate their code programmatically.

### Dynamic Problem Generation
By enforcing strict JSON schemas via `application/json` MIME types in the LLM's response format, the AI outputs structured data. This includes problem constraints, starter code, and test cases based on user prompts or LeetCode URLs, dynamically generating fully functional coding problems.

### Autonomous AI Interviewer Agent
A conversational agent acts as a technical interviewer. By passing the user's current code state and chat history into the LLM's context window, the AI can review code logic and provide progressive hints without giving away the direct answer.

### Automated Performance Evaluation Engine
A specialized prompt pipeline feeds the candidate's final code, test case results, and interview chat transcript into the AI. It generates a comprehensive, structured evaluation report, calculating metrics like Time/Space complexity and communication scores.

---

## 11. Security Architecture

DevMeet implements security at every single layer of the stack:

1. **API Input:** Zod runtime schema validation rejects malformed payloads instantly.
2. **Password Storage:** `bcrypt` with 12 salt rounds.
3. **Session Management:** HTTP-only JWT cookies (immune to XSS).
4. **Third-Party Access:** Token Provider Pattern (master secrets never sent to frontend).
5. **Code Execution:** Hardware-enforced Docker isolation (no network, limits on RAM/CPU/PIDs).
6. **Rate Limiting:** IP-based request throttling on authentication endpoints, backed by Redis to prevent spam and brute-force attacks.

---

## 12. Understanding the Tech Stack

| Category | Tool | Why This One? |
|----------|------|---------------|
| Frontend | React + Vite | Fast HMR during development and optimized bundling for the SPA. |
| Backend | Node.js + Express | Excellent for REST routing, WebSocket/Stream proxying, and async orchestration. |
| Job Queue | BullMQ + Redis | Robust background job processing. Ensures the main backend never blocks during heavy code execution loads. |
| Execution Sandbox | Docker (`docker exec`) | Ephemeral Linux containers provide the highest level of isolation for running untrusted code safely. |
| Real-time Sync | Custom y-websocket Server + Yjs | Self-hosted WebSocket server with CRDT-based conflict resolution for seamless merging of simultaneous edits. |
| Code Editor | Monaco Editor | Rich IntelliSense, multi-language support (JS, Python, C++), and first-class y-monaco Yjs binding. |
| Video SDK | Stream Video | Powers real-time audio/video using WebRTC protocols, handling SFU complexity automatically. |
| AI Integrations | Google Gemini | Powers dynamic problem generation, autonomous interviewer agent, and performance evaluation. |
| Database | MongoDB + Mongoose | Flexible NoSQL document schema with strict ODM enforcement, and easy TypeScript integration. |
| Language & Monorepo | TypeScript + npm workspaces | End-to-end type safety across Client, Server, and Worker. Seamless sharing of interfaces. |

---

## Summary

DevMeet demonstrates:

1. **Robust Queue Architecture** — Handling heavy compute tasks asynchronously without blocking the main API.
2. **Safe Code Execution** — Engineering highly restricted Docker sandboxes to safely run untrusted user code.
3. **Real-Time Collaboration** — CRDT-based text merging via Yjs and a custom y-websocket server.
4. **WebRTC Video Conferencing** — Low-latency video via SFU architecture through Stream SDK.
5. **AI-Powered Experiences** — Automated mock interviews and on-the-fly problem generation powered by Google Gemini.
6. **Security-First Design** — Multi-layer protection from password hashing to kernel capabilities.
7. **Automated Deployment** — Continuous integration and deployment via GitHub Actions to an AWS EC2 instance.

---

## 13. Deployment Architecture

DevMeet is built to be easily deployed to a cloud provider using Docker Compose.

### Production Environment (AWS EC2)
The live application runs on an AWS EC2 instance. The entire stack (Frontend, Backend, Worker, Redis) is orchestrated via a single `docker-compose.yml` file. 

*   **Nginx Reverse Proxy:** We use an Nginx container to route traffic on port 80. API requests are proxied to the Node.js backend, while all other requests serve the static built React frontend.
*   **Memory Management:** Compiling the frontend using Vite requires significant RAM. On smaller EC2 instances (like `t3.micro`), we utilize a large Virtual Swap File (e.g., 6GB) and set `NODE_OPTIONS="--max-old-space-size=4096"` in the Dockerfile to prevent out-of-memory crashes during the build process.

### CI/CD Pipeline (GitHub Actions)
Deployments are 100% automated using GitHub Actions.
1. When code is pushed to the `main` branch, the `.github/workflows/deploy.yml` pipeline triggers.
2. It securely SSHs into the AWS EC2 server using repository Secrets.
3. It syncs the updated codebase (excluding heavy folders like `node_modules`).
4. It executes `docker compose up -d --build` on the server, ensuring zero-downtime rolling updates.

Happy coding! 🚀
