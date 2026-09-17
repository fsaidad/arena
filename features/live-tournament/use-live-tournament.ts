"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { reduceRealtimeEvent, type RealtimeState } from "@/shared/realtime/reducer";

type MatchState = {
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "completed";
};

type SnapshotResponse = {
  version: number;
  generatedAt: string;
  data: { match: MatchState | null };
};

const tournamentId = "northern-circuit-2026";
const initialState: RealtimeState<MatchState> = {
  data: { homeScore: 13, awayScore: 11, status: "live" },
  sequence: 42,
  status: "reconnecting",
  lastConfirmedAt: new Date(0).toISOString(),
};

export function useLiveTournament() {
  const [state, setState] = useState(initialState);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const sourceRef = useRef<EventSource | null>(null);
  const manualOffline = useRef(false);
  const retryCount = useRef(0);

  useEffect(() => {
    if (manualOffline.current) return;
    let cancelled = false;
    let retryTimer: number | undefined;
    const controller = new AbortController();

    async function connect() {
      setState((current) => ({ ...current, status: "reconnecting" }));
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}/snapshot`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("snapshot_unavailable");
        const snapshot = (await response.json()) as SnapshotResponse;
        if (!snapshot.data.match || cancelled) throw new Error("match_unavailable");

        setState({
          data: snapshot.data.match,
          sequence: snapshot.version,
          status: "reconnecting",
          lastConfirmedAt: snapshot.generatedAt,
        });

        const source = new EventSource(
          `/api/tournaments/${tournamentId}/events?after=${snapshot.version}`,
        );
        sourceRef.current = source;
        source.onopen = () => {
          retryCount.current = 0;
          setState((current) => ({ ...current, status: "live" }));
        };
        source.addEventListener("match.result_published", (message) => {
          const event = JSON.parse(message.data) as unknown;
          setState((current) => {
            const reduced = reduceRealtimeEvent(current, event, (data, nextEvent) => {
              const payload = nextEvent.payload as Partial<MatchState>;
              return {
                homeScore: typeof payload.homeScore === "number" ? payload.homeScore : data.homeScore,
                awayScore: typeof payload.awayScore === "number" ? payload.awayScore : data.awayScore,
                status: payload.status === "completed" ? "completed" : data.status,
              };
            });
            if (reduced.kind === "resync") {
              source.close();
              retryTimer = window.setTimeout(
                () => setConnectionAttempt((value) => value + 1),
                250,
              );
            }
            return reduced.state;
          });
        });
        source.addEventListener("resync_required", () => {
          source.close();
          retryTimer = window.setTimeout(() => setConnectionAttempt((value) => value + 1), 250);
        });
        source.onerror = () => {
          source.close();
          if (cancelled || manualOffline.current) return;
          setState((current) => ({ ...current, status: "stale" }));
          const delay = Math.min(15_000, 1_000 * 2 ** retryCount.current++);
          retryTimer = window.setTimeout(() => setConnectionAttempt((value) => value + 1), delay);
        };
      } catch {
        if (cancelled || controller.signal.aborted) return;
        setState((current) => ({ ...current, status: "offline" }));
      }
    }

    void connect();
    return () => {
      cancelled = true;
      controller.abort();
      sourceRef.current?.close();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [connectionAttempt]);

  const disconnect = useCallback(() => {
    manualOffline.current = true;
    sourceRef.current?.close();
    setState((current) => ({ ...current, status: "offline" }));
  }, []);

  const reconnect = useCallback(() => {
    manualOffline.current = false;
    retryCount.current = 0;
    setConnectionAttempt((value) => value + 1);
  }, []);

  return { state, disconnect, reconnect };
}
