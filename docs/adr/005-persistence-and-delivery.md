# ADR 005: PostgreSQL, migrations, and delivery

**Status:** Accepted

Use PostgreSQL with versioned, repeatable SQL migrations executed by the repository migration script. Run web and SSE/API together in a long-lived Next.js Node container. Docker Compose is limited to local PostgreSQL. Do not add Redis, queues, or orchestration before multi-instance fan-out is required.
