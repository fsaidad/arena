# Arena v1 — Product specification

## Product outcome

Within 10–20 seconds, a visitor understands that Arena runs tournaments and keeps spectators synchronized with live match state. The portfolio proof is one loop: an operator changes authoritative match state, spectators see it, and disconnected clients recover safely.

## Users and jobs

- **Spectator:** understand the current match, bracket context, and connection freshness without registering.
- **Participant:** join a seeded demo tournament with no real identity or personal data.
- **Operator:** manage participants, scheduling, and results without admin-only settings.
- **Admin:** perform operator actions and manage tournament configuration and roles.

## MVP

1. Landing with a live seeded match and primary **Open live tournament** CTA.
2. Tournament overview, live match, bracket, standings summary, and lightweight player context.
3. Registration-free demo join.
4. Organizer participant and result management with Viewer/Operator/Admin roles.
5. Explicit loading, empty, error, forbidden, stale, reconnecting, and offline behavior.
6. Versioned live events, reconnect/backoff, duplicate handling, gap detection, and snapshot resync.
7. Public metadata, sitemap, robots, canonical URLs, mobile layout, keyboard access, and reduced motion.

## Out of scope

Payments, betting, odds, wallets, KYC, real PII, social login, real-channel notifications, chat, disputes/evidence, multiple formats, game APIs, streaming, multi-tenant billing, native apps, microservices, Redis, Kafka, and Kubernetes.

## Acceptance criteria

- Meaningful live state in under 10 seconds; a new visitor names the live teams after 15 seconds.
- Demo join in under 45 seconds.
- Result update reaches match, bracket, and standings within one second locally.
- Offline state appears within two seconds; reconnection converges within five seconds.
- Replayed and out-of-order events never advance a bracket twice.
- Keyboard users complete primary journeys; dynamic updates use polite live regions.
- At 360, 768, 1280, and 1440 px, core content is readable without accidental horizontal scrolling.
- Target p75 Web Vitals: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1.

## Product metrics

`landing_view`, `live_demo_opened`, `demo_join_started/completed/failed`, `result_update_started/succeeded/rolled_back`, `realtime_disconnected/reconnected/resynced`, `organizer_tournament_published`.

Analytics must be aggregate and must not record names, free text, IPs, or persistent identifiers.

## Rendering and SEO

- Landing: SSG/ISR.
- Catalog and stable tournament pages: ISR.
- Live match: SSR snapshot plus realtime hydration; normally `noindex`.
- Organizer, demo utility, API, debug, and error pages: dynamic and `noindex`.
- Event JSON-LD only for eligible content; the online-only demo must not claim physical Event rich-result eligibility.
