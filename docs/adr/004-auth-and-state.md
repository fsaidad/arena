# ADR 004: Demo auth and state ownership

**Status:** Accepted

Use opaque demo sessions and server-enforced Viewer/Operator/Admin capabilities. PostgreSQL is authoritative; focused React hooks own snapshot and realtime state; URLs own navigation; React owns transient UI state. This avoids conflicting stores and makes rollback and resync explicit without adding a general-purpose client cache to the focused demo.
