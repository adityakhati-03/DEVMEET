# Phase 9: Practice Mode Implementation

## Overview
This phase introduces a fully functional **Practice Mode** environment in DevMeet. It allows users to create solo rooms with specific programming problems assigned to them, separate from collaborative interview rooms.

## Key Changes

### 1. Shared Types & Backend Models
- Added `Problem` interfaces (`IProblem`, `ProblemDifficulty`, `ProblemExample`, `ProblemTestCase`) in `@devmeet/shared`.
- Added `IPracticeAttempt` interface for tracking execution history.
- Created `Problem` Mongoose model (`apps/server/src/models/Problem.ts`) for storing coding challenges.
- Created `PracticeAttempt` Mongoose model (`apps/server/src/models/PracticeAttempt.ts`) linking a user to a problem and an `ExecutionJob`.
- Added a database seed script (`apps/server/src/seed/problems.seed.ts`) pre-loaded with "Two Sum", "Reverse String", and "Maximum Subarray".

### 2. API Routes & Controllers
- **Problem API** (`/api/problems`): Endpoints to list and fetch individual problems (strips hidden test cases).
- **Practice API** (`/api/practice/rooms` & `/api/practice/attempts`):
  - `POST /api/practice/rooms/:roomId/run`: Submits code for execution. Internally wraps the existing BullMQ/Docker code execution pipeline, while returning a tied `PracticeAttempt` for the frontend to poll.
  - Endpoints to fetch historical attempts and attach problems to rooms.

### 3. Frontend Architecture
- Designed a 3-pane responsive layout for `PracticeMode` (`apps/client/src/components/practice/PracticeLayout.tsx`) utilizing `react-resizable-panels`.
- **ProblemPanel**: Renders Markdown problem descriptions, examples, and constraints.
- **PracticeEditor**: A standalone Monaco editor wrapper (no Yjs integration, purely local state) that retains the custom dark theme.
- **AttemptHistory**: Displays historical executions, execution time, and statuses.
- Replaced the placeholder in `RoomPage.tsx` with `PracticeRoomContainer.tsx` which fetches problem metadata and renders `PracticeLayout` or `ProblemSelector`.

## Architectural Decisions
1. **Isolated Execution Flow**: Instead of building a completely new execution worker for practice mode, the existing `ExecutionJob` flow was reused. `PracticeAttempt` merely acts as a decorator/tracker referencing the core `jobId`.
2. **Short-polling for Output**: Since Practice mode is solo, we rely on HTTP short-polling (`practiceService.getAttempt()`) to retrieve execution updates instead of WebSockets, saving server memory.
3. **Frontend Separation**: By separating `PracticeEditor` from `CollaborativeEditor`, we ensure solo mode doesn't accidentally trigger or wait for WebRTC/Yjs providers to sync.

## Next Steps
Future phases will tackle:
- Full **Interview Mode** implementation.
- Integrating AI for generating problems or providing hints.
