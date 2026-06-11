# Migration Phase 3: Redis Distributed Rate Limiting

## 1. What Changed
We completely replaced the existing in-memory `express-rate-limit` package with a custom, distributed Redis-backed rate limiting solution. This applies strict rate controls across all sensitive routes and connection flows using `ioredis`.

## 2. Why Redis Was Added
As DevMeet scales to multiple Node instances or serverless architectures, in-memory rate limiting becomes ineffective since state isn't shared across workers. Redis ensures consistent, unified throttling globally.

## 3. Why In-Memory Limiting Wasn't Enough
The previous in-memory map approach reset every time the server restarted, didn't share counts across horizontal deployments, and posed potential memory leak issues for long-lived processes tracking thousands of unique IPs.

## 4. Redis Key Design
Keys follow a strict scoping convention to prevent collision:
`rate_limit:{scope}:{identifier}`

## 5. Rate Limit Table
| Feature | Scope | Limit | Window | Identifier |
|---------|-------|-------|--------|------------|
| Login | `auth:login` | 5 | 15 min | IP |
| Signup | `auth:signup` | 5 | 60 min | IP |
| Send OTP | `auth:send-otp` | 3 | 10 min | Email + IP |
| Verify OTP | `auth:verify-otp` | 5 | 10 min | Email + IP |
| Create Room | `room:create` | 20 | 24 hours | User ID |
| Join Room | `room:join` | 20 | 10 min | User ID |
| Run Code | `execute:run` | 10 | 1 min | User ID |
| Stream Token| `stream:token` | 30 | 1 min | User ID |
| WebSocket | `ws:connect` | 30 | 1 min | User ID or IP|

## 6. API Behavior on Limit Exceeded
When a REST endpoint limit is hit, the API returns HTTP Status `429 Too Many Requests` with a JSON payload:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```
All rate-limited responses inject `X-RateLimit-*` headers to indicate limit, remaining, and reset time.

## 7. WebSocket Rate Limiting Behavior
If a user spans WebSocket connection upgrades too quickly (bypassing normal app flow), the server intercepts the upgrade in `authSocket.ts` using the same underlying Redis `rateLimit` utility. If exceeded, the upgrade rejects early and returns `HTTP/1.1 429 Too Many Requests` directly to the client socket before terminating.

## 8. How to Run Redis Locally
A `docker-compose.yml` has been added. Simply run:
```bash
docker-compose up -d redis
```

## 9. Environment Variables
Requires `REDIS_URL` in `.env`:
```
REDIS_URL=redis://localhost:6379
RATE_LIMIT_ENABLED=true
```

## 10. Testing Commands
To easily test the API rate limiting using curl:
```bash
# Hit the login endpoint 6 times rapidly. The 6th attempt should fail with 429.
for i in {1..6}; do curl -X POST -H "Content-Type: application/json" -d '{"identifier": "test", "password": "pass"}' http://localhost:5000/api/auth/login; echo ""; done
```

## 11. Known Limitations
- Fails open: If Redis goes down in production, the application bypasses rate limits to ensure core services remain available.

## 12. Future Improvements
- BullMQ Execution Workers: Utilize the same Redis cluster for asynchronous job processing in the upcoming Phase 4 migration.
