# ADR 004: Demo auth and state ownership

**Status:** Accepted

Use opaque demo sessions and server-enforced Viewer/Operator/Admin capabilities. PostgreSQL is authoritative; TanStack Query owns cached server state; URLs own filters; React owns transient UI state. This avoids conflicting stores and makes rollback and resync explicit.
