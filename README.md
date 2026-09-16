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

This first runnable demo deliberately keeps the data simulator in the web app. The production boundary and event protocol are specified in [`docs/architecture.md`](docs/architecture.md); wiring Fastify/PostgreSQL is the next implementation slice, not falsely presented as finished.

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

## Quality commands

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

The target CI matrix adds Vitest domain tests, Fastify/PostgreSQL integration tests, Playwright journeys with axe, and Lighthouse CI. Acceptance criteria are in [`docs/product-spec.md`](docs/product-spec.md).

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

- Live events and organizer writes are simulated in memory in this first runnable slice.
- Refreshing resets changes; no real authentication or PostgreSQL connection is included yet.
- One seeded tournament and one competition format keep the demo focused.

## Roadmap

1. Extract domain and typed contract packages; connect Fastify, PostgreSQL, migrations, and deterministic seeds.
2. Implement persisted SSE replay, gap detection, idempotency storage, and opaque demo sessions.
3. Add API integration tests and the four Playwright journeys.
4. Add catalog, standings, player pages, notifications, and richer organizer analytics after the core slice is stable.
