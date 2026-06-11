# Migration Phase 8: Room Modes Foundation

## What Changed
Introduced a new foundational architecture to support multiple room modes in DevMeet. Rooms can now be categorized into three distinct modes:
1. **Collaboration Mode** (Editor + Video Conferencing) - Existing behavior.
2. **Practice Mode** (Solo coding practice) - Video disabled by default, solo environment.
3. **Interview Mode** (Normal or AI) - Dedicated environment for interviews.

## Why Room Modes Were Added
As DevMeet evolves into a comprehensive platform for developers, users need different environments for different tasks. Group collaboration is distinct from focused, solo practice, and both differ from a structured technical interview. Room modes allow us to conditionally tailor the UI (video, problem panels, interview feedback) without cluttering the existing real-time collaboration logic.

## Backend Model Changes
The Mongoose `Room` model was extended:
- `mode` (String, enum: `['collaboration', 'practice', 'interview']`, default: `collaboration`)
- `interviewType` (String, enum: `['normal', 'ai', null]`, default: `null`)
- `title` (String)
- `description` (String)
- `settings` (Object with `videoEnabled`, `collaborationEnabled`, `isSolo`)
- `problemId` (ObjectId ref to Problem)
- `status` (String, enum: `['active', 'ended', 'archived']`)

Existing rooms naturally default to `collaboration` due to schema defaults, ensuring backward compatibility.

## API Changes
- **POST /api/rooms**: Now accepts a `CreateRoomRequest` containing `mode`, `interviewType`, `title`, and `description`. Returns extended `IRoom` object.
- **GET /api/rooms/:roomId/join**: For `practice` rooms, joining is restricted to the room creator only.

## Frontend UI Changes
- **Dashboard**: Added a `RoomModeSelector` modal to choose room type and interview type when clicking "Create Room".
- **Dashboard**: Room cards now display a `RoomModeBadge` indicating the room type.
- **Room Page**: Evaluates `room.mode` and conditionally renders:
  - `collaboration`: Existing `CollaborativeEditor` + `StreamRoomProvider`.
  - `practice`: New `PracticeRoomPlaceholder` component.
  - `interview`: New `InterviewRoomPlaceholder` component.

## Current Limitations (Phase 8 boundaries)
- Practice mode is only a placeholder; the problem-fetching and solving system is not yet built.
- Interview mode (Normal/AI) is only a placeholder; workflows and test generation are not yet implemented.
- Participants are still tracked as an array of IDs; migrating them to robust objects with roles (e.g. interviewer, candidate) is deferred to ensure existing rooms do not break.

## Next Phases
- **Phase 9**: Full implementation of the Practice Mode problem system.
- **Phase 10**: Implementation of Normal Interview workflows.
- **Phase 11**: Implementation of AI Interview agent and workflows.
