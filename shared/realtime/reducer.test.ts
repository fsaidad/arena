import { describe, expect, it } from "vitest";
import { reconnectDelay, reduceRealtimeEvent, type RealtimeState } from "./reducer";

const event = (sequence: number) => ({
  eventId: "10000000-0000-4000-8000-000000000001",
  streamId: "tournament:arena",
  sequence,
  schemaVersion: 1 as const,
  aggregateVersion: sequence,
  type: "match.score_updated",
  occurredAt: "2026-09-17T10:00:00.000Z",
  correlationId: "20000000-0000-4000-8000-000000000001",
  payload: { score: sequence },
});

const state: RealtimeState<{ score: number }> = {
  data: { score: 10 }, sequence: 10, status: "live", lastConfirmedAt: "2026-09-17T09:59:00.000Z",
};

describe("reduceRealtimeEvent", () => {
  it("drops duplicate events", () => {
    expect(reduceRealtimeEvent(state, event(10), (data) => data).kind).toBe("duplicate");
  });

  it("marks state stale when an event gap is detected", () => {
    const result = reduceRealtimeEvent(state, event(12), (data) => data);
    expect(result.kind).toBe("resync");
    expect(result.state.status).toBe("stale");
  });

  it("applies exactly the next event", () => {
    const result = reduceRealtimeEvent(state, event(11), (_, next) => ({ score: Number((next.payload as { score: number }).score) }));
    expect(result.kind).toBe("applied");
    expect(result.state.data.score).toBe(11);
    expect(result.state.sequence).toBe(11);
  });
});

describe("reconnectDelay", () => {
  it("uses capped exponential backoff with deterministic jitter", () => {
    expect(reconnectDelay(0, () => 0.5)).toBe(1_000);
    expect(reconnectDelay(3, () => 0.5)).toBe(8_000);
    expect(reconnectDelay(9, () => 0.5)).toBe(15_000);
  });
});
