import { arenaEventSchema, type ArenaEvent } from "./contract";

export type RealtimeState<T> = {
  data: T;
  sequence: number;
  status: "live" | "stale" | "reconnecting" | "offline";
  lastConfirmedAt: string;
};

export type Reduction<T> =
  | { kind: "applied"; state: RealtimeState<T> }
  | { kind: "duplicate"; state: RealtimeState<T> }
  | { kind: "resync"; reason: "gap" | "unsupported-event"; state: RealtimeState<T> };

export function reduceRealtimeEvent<T>(
  state: RealtimeState<T>,
  candidate: unknown,
  apply: (data: T, event: ArenaEvent) => T,
): Reduction<T> {
  const parsed = arenaEventSchema.safeParse(candidate);
  if (!parsed.success) {
    return { kind: "resync", reason: "unsupported-event", state: { ...state, status: "stale" } };
  }

  const event = parsed.data;
  if (event.sequence <= state.sequence) return { kind: "duplicate", state };
  if (event.sequence !== state.sequence + 1) {
    return { kind: "resync", reason: "gap", state: { ...state, status: "stale" } };
  }

  return {
    kind: "applied",
    state: {
      data: apply(state.data, event),
      sequence: event.sequence,
      status: "live",
      lastConfirmedAt: event.occurredAt,
    },
  };
}

export function reconnectDelay(attempt: number, random = Math.random): number {
  const base = Math.min(15_000, 1_000 * 2 ** Math.max(0, attempt));
  return Math.round(base * (0.8 + random() * 0.4));
}
