# ADR 005: PostgreSQL, migrations, and delivery

**Status:** Accepted

Use PostgreSQL with stable Drizzle migrations. Run web on a Next-capable host and SSE/API on a long-lived Node container behind a same-origin proxy. Docker is limited to local PostgreSQL and production-like API runs. Do not add Redis, queues, or orchestration before multi-instance fan-out is required.
