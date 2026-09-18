"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DemoRole = "viewer" | "operator" | "admin";
type Mode = "connecting" | "persisted" | "preview";

type SnapshotResponse = {
  version: number;
  data: {
    match: {
      homeScore: number;
      awayScore: number;
      status: "scheduled" | "live" | "completed";
    } | null;
  };
};

const tournamentId = "northern-circuit-2026";

export function useMatchControl(role: DemoRole) {
  const [homeScore, setHomeScore] = useState(13);
  const [score, setScore] = useState(11);
  const [matchStatus, setMatchStatus] = useState<"scheduled" | "live" | "completed">("live");
  const [version, setVersion] = useState(42);
  const [mode, setMode] = useState<Mode>("connecting");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("Connecting to tournament service…");
  const confirmedScore = useRef(11);

  useEffect(() => {
    const controller = new AbortController();
    async function initialize() {
      setMode("connecting");
      try {
        const [snapshotResponse, sessionResponse] = await Promise.all([
          fetch(`/api/tournaments/${tournamentId}/snapshot`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/demo/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
            signal: controller.signal,
          }),
        ]);
        if (!snapshotResponse.ok || !sessionResponse.ok) throw new Error("service_unavailable");
        const snapshot = (await snapshotResponse.json()) as SnapshotResponse;
        if (snapshot.data.match) {
          setHomeScore(snapshot.data.match.homeScore);
          setScore(snapshot.data.match.awayScore);
          confirmedScore.current = snapshot.data.match.awayScore;
          setMatchStatus(snapshot.data.match.status);
        }
        setVersion(snapshot.version);
        setMode("persisted");
        setNotice("Connected · all changes are persisted");
      } catch {
        if (controller.signal.aborted) return;
        setMode("preview");
        setNotice("Preview mode · connect PostgreSQL to persist changes");
      }
    }
    void initialize();
    return () => controller.abort();
  }, [role]);

  const publishResult = useCallback(
    async (nextScore: number) => {
      const previousScore = confirmedScore.current;
      setScore(nextScore);
      if (mode !== "persisted") {
        confirmedScore.current = nextScore;
        setNotice("Result updated in preview mode");
        return;
      }

      setSaving(true);
      setNotice("Saving result…");
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}/results`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            matchId: "upper-final",
            homeScore,
            awayScore: nextScore,
            expectedVersion: version,
          }),
        });
        const body = (await response.json()) as { version?: number; error?: string };
        if (!response.ok || body.version === undefined) throw new Error(body.error ?? "save_failed");
        confirmedScore.current = nextScore;
        setVersion(body.version);
        setMatchStatus("completed");
        setNotice("Result saved · live clients updated");
      } catch (error) {
        setScore(previousScore);
        setNotice(
          error instanceof Error && error.message === "version_conflict"
            ? "Newer result detected · refresh before retrying"
            : "Could not save · previous score restored",
        );
      } finally {
        setSaving(false);
      }
    },
    [homeScore, mode, version],
  );

  return { homeScore, score, setScore, matchStatus, version, mode, saving, notice, setNotice, publishResult };
}
