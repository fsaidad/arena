# ADR 001: Repository and frontend boundaries

**Status:** Accepted

Use a pnpm monorepo when the API slice lands. The web follows Feature-Sliced Design: `app → pages → widgets → features → entities → shared`, with explicit public APIs and no upward imports. This modest structure makes domain/UI/server boundaries visible and enforceable.
