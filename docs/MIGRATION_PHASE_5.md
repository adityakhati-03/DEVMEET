# Migration Phase 5: Docker Sandbox Execution

## 1. What Changed
The temporary Wandbox API used for code execution has been replaced with a custom, secure Docker-based sandboxing system. 
The BullMQ worker now spawns ephemeral Docker containers locally to compile and execute user code, applying strict limits on CPU, memory, and network access.

## 2. Why Wandbox Was Replaced
- **Security & Control**: Relying on a public, unauthenticated 3rd-party API for code execution is not suitable for production. We needed full control over the execution environment.
- **Resource Limits**: Wandbox lacks fine-grained controls over execution timeouts, memory usage, and output size for our specific use case.
- **Dependency**: We removed a major external dependency, making the platform self-contained.

## 3. New Docker Execution Architecture
The execution pipeline remains entirely asynchronous:
```
Client
  ↓ POST /api/execution/run
Express API
  ↓ Creates MongoDB ExecutionJob (status: queued)
  ↓ Pushes to BullMQ Queue
Redis
  ↓ Pops job
Worker (apps/worker)
  ↓ Reads configuration based on Language ID
  ↓ Writes code & stdin to temporary host directory
  ↓ Spawns Docker container (mounted temp dir)
  ↓ Captures stdout/stderr via Streams (truncated if too large)
  ↓ Maps Docker exit code to status (completed, failed, timeout, compile_error, runtime_error)
  ↓ Updates MongoDB ExecutionJob
Client polling
  ↓ Displays result
```

## 4. Supported Languages
In this phase, we support a limited set of languages using official Docker images:

| Language | ID | Docker Image | Compile Command | Run Command |
|---|---|---|---|---|
| JavaScript | 1 | `node:22-slim` | *None* | `node main.js` |
| Python | 2 | `python:3.12-slim` | *None* | `python main.py` |
| C++ | 4 | `gcc:latest` | `g++ -O2 -o main main.cpp` | `./main` |

*Note: Other languages currently fallback to Wandbox if `EXECUTION_PROVIDER` is set to `wandbox`, otherwise they will fail if unsupported.*

## 5. Execution Flow
1. **Validation**: API validates code and stdin sizes.
2. **Worker Setup**: Worker creates a unique temporary directory (e.g., `/tmp/devmeet-exec-uuid`) and writes `main.ext` and `stdin.txt`.
3. **Compilation (C++)**: Worker spawns a container to compile the code. If compilation fails, the job is marked `compile_error`.
4. **Execution**: Worker spawns a container to run the code. Stdin is redirected from `stdin.txt`.
5. **Monitoring**: The worker uses Node's `child_process.spawn` (no shell interpolation) to monitor stdout/stderr. Output is truncated if it exceeds limits.
6. **Cleanup**: The container is destroyed (`--rm`), and the temporary host directory is deleted.

## 6. Security Limits
To mitigate the risks of executing untrusted code, the following Docker restrictions are applied:

- `--network none`: Complete network isolation. No outbound requests (e.g., `curl`, `fetch`) will succeed.
- `--memory 128m` & `--memory-swap 128m`: Hard limit on RAM usage. Attempts to allocate more will result in an OOM kill.
- `--cpus 0.5`: Limits execution to half a CPU core to prevent CPU starvation.
- `--pids-limit 128`: Prevents fork bombs by limiting the number of processes.
- `--user 65534`: Runs the process as the `nobody` user, not `root`.
- **Timeout**: Enforced via the Linux `timeout` command and a secondary Node.js timer (`AbortSignal` pattern).
- **Filesystem**: The container only has write access to the mounted `/sandbox` directory.

Please read `docs/DOCKER_SANDBOX_SECURITY.md` for a comprehensive threat model and limitations.

## 7. Environment Variables
New environment variables have been added to the worker (see `apps/worker/.env.example`):

```env
# Execution provider: "docker" (default) or "wandbox"
EXECUTION_PROVIDER=docker

# Sandbox limits
EXECUTION_TIMEOUT_MS=5000
EXECUTION_MEMORY_MB=128
EXECUTION_CPU_LIMIT=0.5
EXECUTION_MAX_CODE_SIZE_KB=64
EXECUTION_MAX_STDIN_SIZE_KB=16
EXECUTION_MAX_OUTPUT_SIZE_KB=64
```

## 8. How to Run Locally
Ensure you have Docker installed and the Docker daemon running. The worker process needs permission to interact with Docker.

```bash
# 1. Start Redis
docker-compose up -d redis

# 2. Start the API Server
npm run dev:server

# 3. Start the Worker
npm run dev:worker

# 4. Start the Client
npm run dev:client
```
*Tip: Pre-pull the Docker images (`docker pull node:22-slim`, etc.) to avoid delays on the first code execution.*

## 9. Known Limitations
- The system currently requires the worker to run on a host with Docker access.
- Only JS, Python, and C++ are fully supported in the Docker sandbox right now.
- Client still relies on polling rather than WebSocket push notifications for job completion.

## 10. Future Improvements
- Add support for remaining languages (Java, Go, Rust, Ruby, PHP) using custom minimal Docker images.
- Implement WebSocket push for execution results.
- Explore stronger isolation mechanisms (e.g., gVisor, Firecracker VM) for production deployments.
