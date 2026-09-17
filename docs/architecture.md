# Arena technical design

## Runtime shape

Arena v1 is a single Next.js App Router service backed by PostgreSQL. The browser, route handlers, SSE stream, and migrations ship from one repository and one deployable artifact.

```text
Browser UI
  ├─ GET  /api/tournaments/:id/snapshot
  ├─ GET  /api/tournaments/:id/events?after=:sequence
  ├─ POST /api/demo/session
  └─ POST /api/tournaments/:id/results
                    │
             Next.js route handlers
                    │
                PostgreSQL
       matches · sessions · idempotency
           event log · audit log
```

The modular monolith keeps deployment and debugging simple for a focused portfolio slice. API contracts, database access, realtime reduction, and browser features remain separated by module boundaries so they can be extracted later if scale or team ownership justifies it.

## State ownership

PostgreSQL is authoritative for tournaments, matches, event sequences, sessions, idempotency records, and audit history. The browser keeps only rendered server state and transient interaction state. Roster add/reset behavior is explicitly a page-local demo interaction.

## Realtime protocol

`GET /api/tournaments/:id/snapshot` returns `{ streamId, version, generatedAt, data }`.

`GET /api/tournaments/:id/events?after=<sequence>` returns `text/event-stream`. Each persisted envelope contains an event ID, stream ID, sequence, schema version, aggregate version, timestamp, correlation ID, type, and payload.

- A sequence at or below the cursor is a duplicate and is ignored.
- The next expected sequence is applied.
- A gap or expired cursor preserves the last confirmed view and requests a fresh snapshot.
- Reconnect uses capped exponential backoff and resumes from the confirmed version.
- Heartbeats keep an otherwise idle connection observable through proxies.

## Mutation integrity

Result mutations include an `Idempotency-Key` header and `expectedVersion` body field. One PostgreSQL transaction:

1. verifies the session capability;
2. checks the expected tournament version;
3. updates the match;
4. increments the tournament version;
5. appends the uniquely sequenced event;
6. records the audit entry and idempotent response.

A repeated key with the same request hash returns the stored response. A reused key with different content or a stale aggregate version returns `409`.

## Security boundary

Demo sessions use opaque random tokens. Only token hashes are stored; the browser receives the token in a Secure, HttpOnly, SameSite=Lax cookie. Viewer, operator, and admin capabilities are checked at the mutation boundary. Inputs are validated before database work and public error responses avoid internal details.

This is intentionally demo authentication. Production identity, account recovery, multi-tenant isolation, rate limiting at the edge, and abuse operations are separate product work.

## Delivery and operations

- GitHub Actions runs lint, strict type checks, unit tests, PostgreSQL integration tests, Playwright/axe journeys, Lighthouse budgets, and a production build.
- Railway waits for a successful commit check suite before deploying.
- `pnpm db:migrate` runs before a new container starts.
- `/api/health` performs a database readiness query before promotion.
- Serverless sleeping is disabled because Arena maintains long-lived SSE connections.
- The public origin is injected through `NEXT_PUBLIC_SITE_URL` for canonical SEO output.

## Scale path

The current deployment uses one long-lived application replica. The first justified scale step is PostgreSQL `LISTEN/NOTIFY` or a dedicated fan-out adapter so SSE clients connected to different replicas observe the same committed events. Redis, Kafka, microservices, and Kubernetes remain intentionally out of scope until measured load requires them.
