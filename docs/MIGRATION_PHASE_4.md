# Migration Phase 4: Async BullMQ Code Execution Pipeline

## 1. What Changed
The `POST /api/execution/run` endpoint no longer calls Wandbox synchronously inside the request lifecycle. Instead it:
1. Validates the request and room membership.
2. Creates an `ExecutionJob` document in MongoDB with `status: "queued"`.
3. Pushes the job onto a BullMQ `code-execution` Redis queue.
4. Returns immediately with a `jobId`.

A separate `apps/worker` microservice consumes jobs from the queue, calls Wandbox, and writes the result back to MongoDB. The client polls `GET /api/execution/jobs/:jobId` until a terminal state is reached.

## 2. Why Async Execution Was Added
- **API responsiveness**: The API no longer blocks for 5–30 seconds waiting for code to compile and run.
- **Fault tolerance**: If Wandbox fails, BullMQ retries the job automatically (up to 2 attempts with exponential backoff).
- **Scalability**: Workers can scale independently of the Express API servers.
- **Auditability**: Every execution is now stored as a persistent `ExecutionJob` document in MongoDB.

## 3. Old Execution Flow
```
Client → POST /api/execution/run → Express directly calls Wandbox → waits 5-30s → response
```

## 4. New BullMQ Execution Flow
```
Client → POST /api/execution/run → Create ExecutionJob in MongoDB → Push to BullMQ queue → Return jobId (202)
                                                                                    ↓
                                                                             Worker picks job
                                                                                    ↓
                                                                             Calls Wandbox
                                                                                    ↓
                                                                       Updates ExecutionJob (completed/failed/timeout)
                                                                                    ↓
                                                            Client polls GET /api/execution/jobs/:jobId every 1s
                                                                                    ↓
                                                                          Displays final output
```

## 5. Queue Architecture
- **Queue name**: `code-execution`
- **Backend**: BullMQ (backed by Redis)
- **Concurrency**: 5 jobs in parallel per worker instance
- **Retries**: Up to 2 attempts, exponential backoff (2s initial delay)
- **Cleanup**: Completed jobs auto-removed from Redis. Failed jobs retained for inspection.
- **Job timeout**: Wandbox requests use a 30-second `AbortSignal` timeout.

## 6. ExecutionJob Schema
| Field | Type | Description |
|---|---|---|
| `jobId` | String (UUID) | Unique job identifier |
| `roomId` | String | The room this execution belongs to |
| `userId` | String | Who triggered the execution |
| `language` | String | Human-readable language name |
| `code` | String | The submitted source code |
| `stdin` | String | Standard input for the program |
| `status` | Enum | `queued` / `running` / `completed` / `failed` / `timeout` |
| `stdout` | String | Program output |
| `stderr` | String | Program error output |
| `errorMessage` | String | Compilation error or timeout message |
| `executionTimeMs` | Number | Wall-clock execution time |
| `compiler` | String | Wandbox compiler name |
| `startedAt` | Date | When worker started processing |
| `completedAt` | Date | When worker finished processing |

> TTL index: Jobs auto-expire from MongoDB after 7 days.

## 7. Worker Lifecycle
1. Bootstrap: Connects to MongoDB and registers BullMQ Worker on `code-execution` queue.
2. **On job received**: Logs receipt.
3. **Status → `running`**: Updates MongoDB, records `startedAt`.
4. **Calls Wandbox**: With 30s timeout via `AbortSignal`.
5. **Status → `completed`**: Writes `stdout`, `stderr`, `executionTimeMs`, `completedAt`.
6. **Status → `failed`**: Writes `errorMessage` (compilation error or Wandbox HTTP error).
7. **Status → `timeout`**: Writes `"Execution timed out after 30 seconds."`.
8. Re-throws errors so BullMQ can handle retries.
9. Graceful shutdown on `SIGTERM`/`SIGINT`.

## 8. API Changes

### `POST /api/execution/run` (changed)
Request now requires `roomId`:
```json
{ "code": "...", "languageId": 1, "roomId": "my-room", "stdin": "" }
```
Response is now immediate (HTTP 202):
```json
{ "success": true, "data": { "jobId": "uuid", "status": "queued", "message": "Execution job queued successfully." } }
```

### `GET /api/execution/jobs/:jobId` (new)
Returns current job status and results. Auth required. User must belong to the job's room.

### `GET /api/rooms/:roomId/executions` (new)
Returns up to 20 recent execution jobs for a room. Auth + room membership required.

## 9. Frontend Polling Behavior
1. User clicks **Run** → shows `⏳ Queued...`.
2. Job enqueued → API returns `jobId`.
3. Client polls `GET /api/execution/jobs/:jobId` every **1 second**.
4. Shows `🔄 Running...` when status is `running`.
5. On `completed` → shows `stdout` + `stderr`.
6. On `failed` → shows `❌ Compilation/Runtime Error: ...`.
7. On `timeout` → shows `⏱ Execution timed out.`.
8. Safety cap: polling stops after 60 seconds.

## 10. How to Run Worker Locally
```bash
# Terminal 1 — Redis
docker-compose up -d redis

# Terminal 2 — Server API
npm run dev:server

# Terminal 3 — Worker
npm run dev:worker

# Terminal 4 — Client
npm run dev:client
```
Copy `apps/worker/.env.example` to `apps/worker/.env` and fill in `MONGODB_URI` and `REDIS_URL`.

## 11. Environment Variables
### `apps/worker/.env`
```
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://localhost:6379
WANDBOX_API_URL=https://wandbox.org/api/compile.json
NODE_ENV=development
```

## 12. Known Limitations
- Wandbox is still a temporary executor — Docker-based sandboxed execution is the next phase.
- There is no WebSocket push from worker to client; clients must poll.
- A single worker crash loses in-flight jobs (BullMQ will retry on restart).

## 13. Future Docker Execution Phase
Phase 5 will replace Wandbox with a fleet of sandboxed Docker containers:
- Each execution runs in an isolated container with CPU/memory limits.
- The worker spawns containers on-demand and streams output back.
- BullMQ ensures fair queuing even under heavy load.
