# ADR 003: Server-Sent Events

**Status:** Accepted

Use REST for client writes and SSE for server-to-client match, bracket, and audit updates. SSE supplies native event IDs with less protocol surface than WebSocket. Persist events for replay; detect duplicates and gaps by stream sequence and resync from a snapshot when continuity is uncertain.
