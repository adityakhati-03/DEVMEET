# Docker Sandbox Security — DevMeet Code Execution

## 1. Threat Model

DevMeet allows authenticated users to submit and run arbitrary code inside a shared developer room. The primary threats are:

| Threat | Example |
|---|---|
| **Host compromise** | Code that escapes the sandbox and accesses the host OS |
| **Denial of Service** | Infinite loops, memory bombs, fork bombs |
| **Network exfiltration** | Code that makes outbound HTTP requests to leak data |
| **Filesystem access** | Code that reads host files or writes persistent data |
| **Privilege escalation** | Code running as root inside a container with excessive capabilities |

---

## 2. Why Code Execution Is Dangerous

Running untrusted code is one of the highest-risk operations any platform can perform. Even sandboxed execution environments have historically had vulnerabilities. A compromised execution environment can:

- Read host secrets (API keys, SSH keys, database credentials)
- Pivot to other services on the internal network
- Consume resources and cause denial-of-service
- Establish reverse shells or exfiltrate data

DevMeet's architecture acknowledges these risks and applies defence-in-depth using Docker container isolation.

---

## 3. Why Docker Isolation Is Used

Docker provides:
- **Namespace isolation**: container processes cannot see host processes
- **cgroups resource limits**: enforced CPU, memory, and PID caps
- **Network namespaces**: complete network isolation with `--network none`
- **Filesystem isolation**: container only mounts a single temporary working directory
- **Image isolation**: well-known, minimal public images with small attack surfaces

---

## 4. Current Security Restrictions

Every code execution container is started with:

| Flag | Value | Purpose |
|---|---|---|
| `--network none` | — | Completely disables network access |
| `--memory` | `128m` | Caps RAM usage |
| `--memory-swap` | `128m` | Disables swap (equal to memory = no swap) |
| `--cpus` | `0.5` | Limits CPU to half a core |
| `--pids-limit` | `128` | Prevents fork bombs |
| `--user` | `65534` (nobody) | Container process runs as a non-root user |
| `--rm` | — | Container auto-removed after execution |
| Timeout | `5s` via `sh -c timeout N` | Kills process after N seconds |
| AbortSignal | +3s wrapper | Kills Docker CLI if container hangs |
| Volume mount | `/sandbox:rw` only | Only the temp working directory is accessible |
| Temp dir cleanup | `fs.rm(workDir)` | Host temp files deleted after every run |

**Output limits:**
- stdout: max 64 KB (truncated if exceeded)
- stderr: max 64 KB (truncated if exceeded)
- Code: max 64 KB rejected at API level
- stdin: max 16 KB rejected at API level

---

## 5. Remaining Risks

> This is an honest assessment. DevMeet's sandbox is suitable for a development tool / learning platform but is **not** production-grade for executing completely untrusted public code.

| Risk | Severity | Status |
|---|---|---|
| Container escape via kernel vulnerabilities | High | ⚠️ Unmitigated — Docker alone does not prevent kernel exploits |
| Shared Docker daemon socket | Medium | ⚠️ Worker must have Docker access — compromise of worker = Docker access |
| Docker image pull from public registry | Low | ℹ️ Images are not audited |
| No seccomp profile applied | Medium | ⚠️ Default Docker seccomp is applied but no custom profile |
| No AppArmor/SELinux profiles | Medium | ⚠️ Not configured |
| Timeout bypass via spawned subprocesses | Low | ℹ️ Mitigated by `--pids-limit` and kill via SIGKILL |
| Long startup time on first pull | Low | ℹ️ Pre-pull images to avoid cold start delays |

---

## 6. Why This Is Not Perfect Production-Grade Sandboxing

Docker containers share the host kernel. A kernel exploit inside a container can potentially break out. For fully untrusted public users (e.g., a public coding platform), stronger isolation layers are required.

---

## 7. Future Improvements

### gVisor (Google)
An OCI-compatible container runtime that intercepts syscalls in userspace, providing an additional kernel isolation layer. Can be used as a Docker runtime (`--runtime=runsc`).

### Firecracker (AWS)
Lightweight VMMs (micro-VMs) that provide true hardware-level isolation. Used by AWS Lambda. Significantly stronger than Docker alone.

### Custom seccomp Profiles
Restrict the exact set of Linux syscalls a container may call. E.g., deny `ptrace`, `clone`, `mount`, `unshare`.

### Per-Language Custom Images
Build minimal custom Docker images that:
- Only contain the required runtime
- Have no package managers
- Run with read-only root filesystem

### Queue Isolation
Separate BullMQ queues per language or trust level to prevent one language's behavior from affecting others.

### Kubernetes Jobs
Run each execution as a Kubernetes Job with resource quotas, namespace isolation, and NetworkPolicy restrictions.

### Rate Limiting
Per-user and per-room execution rate limits are already applied at the API layer via Redis.
