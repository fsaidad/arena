# ADR 002: Modular monolith and typed REST

**Status:** Accepted

Use one Fastify modular monolith with ts-rest/Zod contracts. It is smaller than a distributed system, preserves HTTP semantics, and provides schema validation. Next route handlers remain a BFF, not the long-lived realtime backend.
