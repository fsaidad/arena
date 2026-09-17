# Arena

[GitHub repository](https://github.com/fsaidad/arena)

Arena is a production-minded real-time tournament platform demo. Spectators follow a live match and bracket while an organizer manages participants and publishes results from a focused operations workspace.

> Local demo only. No deployment, external accounts, payments, gambling mechanics, or real personal data are used.

## What you can try

- Open the seeded Northern Circuit tournament and watch the score update.
- Use **Test offline** to preserve stale data, show the degraded state, and reconnect.
- Enter the demo without registering.
- Open `/organizer`, switch between Viewer, Operator, and Admin, add a participant, and publish a result.
- Reset the organizer workspace to its safe seed data.
- Switch themes; use the entire product with a keyboard.

## Why this stack

The target architecture is a pnpm monorepo with Next.js App Router, strict TypeScript, Feature-Sliced Design, TanStack Query, a Fastify modular monolith, typed REST contracts, PostgreSQL/Drizzle, and SSE. Next.js gives public pages strong rendering and metadata primitives. SSE fits Arena's one-way server-to-client live updates; all writes remain explicit, idempotent HTTP mutations.

The polished UI demo still runs without infrastructure. A PostgreSQL-backed API foundation is now included for durable snapshots, resumable SSE streams, opaque demo sessions, optimistic concurrency, idempotent writes, and audit records.

## Architecture at a glance

```text
Browser: Next pages + TanStack Query + EventSource
               │ same-origin proxy
Fastify modular monolith: typed REST + RBAC + SSE replay
               │
PostgreSQL: snapshots + event log + audit log
```

## Local development

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open the local URL printed by the development server. Main routes: `/` and `/organizer`.

To exercise the persisted API, start the development database, copy `.env.example` to `.env.local`, and apply the migration:

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm dev
```

The API exposes a demo-session endpoint, tournament snapshots, resumable SSE events, and an idempotent result-publishing mutation. Session tokens are stored only as hashes and sent in an HttpOnly cookie.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm lighthouse
pnpm build
```

CI runs linting, strict type checks, Vitest domain tests, PostgreSQL-backed API integration tests, responsive Playwright journeys with axe, Lighthouse budgets, and a production build. Acceptance criteria are in [`docs/product-spec.md`](docs/product-spec.md).

## Engineering decisions

- The server is authoritative; realtime messages patch or invalidate cached server state.
- Events carry an ID, stream sequence, schema version, aggregate version, timestamp, and correlation ID.
- Duplicates are dropped, gaps force snapshot resync, and reconnect uses exponential backoff with jitter.
- Mutations carry an idempotency key and expected aggregate version.
- Viewer, operator, and admin capabilities are enforced at the API boundary.
- URL parameters own public filters; local React state owns ephemeral controls only.
- Public pages are crawlable; organizer/API routes are `noindex`.

Short ADRs are in [`docs/adr`](docs/adr).

## Demo limitations

- The current UI remains connected to its in-browser demo state; the persisted endpoints are ready for client integration.
- Demo sessions are intentionally short-lived and are not a replacement for production identity.
- One seeded tournament and one competition format keep the demo focused.

## Roadmap

1. ✅ Ship the public, accessible UI demo and production architecture.
2. ✅ Add persisted SSE replay, gap detection, idempotency storage, opaque demo sessions, and audit logging.
3. ✅ Connect the live score and organizer controls to the persisted API; verify SSE, RBAC, and idempotency against PostgreSQL.
4. ✅ Add responsive Playwright journeys, automated accessibility checks, and Lighthouse budgets.
5. Deploy the web app and managed PostgreSQL, then publish the live demo URL and screenshots.
6. Add catalog, standings, player pages, notifications, and richer organizer analytics after the core slice is stable.
