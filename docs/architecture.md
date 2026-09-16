# Arena technical design

## Repository target

```text
apps/web            Next.js App Router, Feature-Sliced Design
apps/api            Fastify modular monolith
packages/contracts  ts-rest + Zod schemas
packages/domain     pure tournament rules and event reducer
packages/config     shared TypeScript/lint configuration
```

The current runnable demo is intentionally a single web checkout; this target structure arrives with the real API slice.

## State ownership

PostgreSQL is authoritative. TanStack Query owns browser server state. Realtime messages patch or invalidate that cache and never create a second domain store. URLSearchParams own filters and navigational tabs. Local React state owns dialogs, menus, drafts, and the connection indicator.

## Realtime protocol

`GET /v1/tournaments/:id/snapshot` returns `{ streamId, version, generatedAt, data }`.

`GET /v1/tournaments/:id/events?after=<version>` returns `text/event-stream`. Each envelope contains `eventId`, `streamId`, `sequence`, `schemaVersion`, `aggregateVersion`, `type`, `occurredAt`, `correlationId`, and `payload`.

Sequence at or below the cursor is a duplicate. The next sequence is applied. Any gap, unknown schema, or expired cursor preserves the last view as stale, fetches a snapshot, then reopens the stream. Reconnect uses exponential backoff with jitter (1, 2, 4, 8, 15 second cap) and resumes immediately when the browser returns online.

## Mutation integrity

Organizer mutations include `Idempotency-Key` and `expectedVersion`. In one transaction the API validates RBAC and version, changes domain rows, increments tournament version, inserts the unique event-log sequence, appends an audit entry, and commits. A repeated key with the same request hash returns the saved response; a different hash or stale version returns `409` and triggers resync.

## Security and operations

Demo identities use opaque, hashed session tokens in Secure, HttpOnly, SameSite=Lax cookies. Capabilities and tournament membership are checked server-side for REST and SSE. Requests use schema validation, origin checks, rate/body limits, environment validation, structured problem errors, IDs, and log redaction. V1 runs one long-lived API replica; scale-out starts with PostgreSQL LISTEN/NOTIFY only when justified.

## Verification target

Vitest covers bracket rules, permissions, event reduction, backoff, rollback, and idempotency. Fastify integration tests run against PostgreSQL. Playwright covers spectator live updates, demo join, operator changes, and offline/resync across two contexts. Axe and keyboard smoke tests cover public and organizer routes; Lighthouse CI audits built public pages.
