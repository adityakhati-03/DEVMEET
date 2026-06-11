# Migration Phase 2: Liveblocks Removal & Custom Yjs Collaboration

## What changed
We removed all dependencies and code associated with Liveblocks (the managed real-time collaboration layer) and replaced it with a custom, self-hosted Node.js + WebSocket + Yjs architecture.

## Why Liveblocks was removed
To reduce reliance on managed third-party services and gain full control over room state, synchronization logic, and data persistence within our own infrastructure.

## New custom Yjs WebSocket architecture
- **Backend**: We attached a `ws` WebSocketServer to the existing Express HTTP server. We use the standard `y-websocket` server utilities to manage room-scoped `Y.Doc` instances in memory and broadcast document updates to connected clients.
- **Frontend**: The Liveblocks provider has been replaced with a custom `CollaborationProvider` that uses a `y-websocket` client provider and manages connection state (connecting, connected, error). CodeMirror binds directly to this Y.Doc using standard `y-codemirror.next`.

## WebSocket authentication flow
1. When a client mounts `CollaborationProvider`, it establishes a WebSocket connection to `ws://localhost:5000/collaboration/:roomId`.
2. The browser automatically sends the user's `httpOnly` JWT cookie (from the REST API authentication).
3. The server's `authSocket.ts` middleware parses the `token` from the connection headers (or fallback to URL query parameters) and verifies the JWT.
4. If authentication fails, the connection is rejected.

## Room authorization flow
After parsing the JWT in `authSocket.ts`, the backend queries MongoDB to ensure the user is an authorized participant (or creator) of the requested `roomId`. If they are not, the WebSocket connection is denied.

## Y.Doc room lifecycle
- When the first authorized user joins a room, a `Y.Doc` is created in memory by the `y-websocket` utility on the backend.
- As users edit, Yjs updates are synced.
- The state includes `codemirror` (Y.Text) and `metadata` (Y.Map for language, input, output, execution state).
- When the last user disconnects, the document is kept briefly and can optionally be persisted to MongoDB.

## Persistence strategy
We integrated `setPersistence` from `y-websocket/bin/utils`.
- **Load**: On the first connection to a room, the server attempts to retrieve a serialized Yjs update buffer from the `CollaborationDocument` MongoDB collection and applies it to the new `Y.Doc`.
- **Save**: When all users disconnect from a room, the server encodes the `Y.Doc` state and updates the MongoDB `CollaborationDocument` record.

## Known limitations
- Code execution is still handled via HTTP requests to `Wandbox`, not yet Docker.
- Advanced cursor presence tracking (mouse x/y coordinates) is currently simplified to active user lists.

## Future improvements
- **Redis Integration**: Add Redis for rate-limiting and potentially as a Pub/Sub layer if we need to scale WebSockets horizontally across multiple Node instances.
- **Docker Code Execution**: Replace Wandbox with a self-hosted Docker-based execution runner using BullMQ workers.
