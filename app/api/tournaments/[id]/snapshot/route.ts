import { NextResponse } from "next/server";

import { getDatabase } from "@/server/db/client";
import type { Snapshot } from "@/shared/realtime/contract";

export const runtime = "nodejs";

type TournamentSnapshot = {
  tournament: { id: string; slug: string; name: string };
  match: {
    id: string;
    status: "scheduled" | "live" | "completed";
    homeName: string;
    awayName: string;
    homeScore: number;
    awayScore: number;
  } | null;
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const sql = getDatabase();
    const [row] = await sql<
      {
        id: string;
        slug: string;
        name: string;
        version: string;
        match_id: string | null;
        status: "scheduled" | "live" | "completed" | null;
        home_name: string | null;
        away_name: string | null;
        home_score: number | null;
        away_score: number | null;
      }[]
    >`
      SELECT t.id, t.slug, t.name, t.version::text,
             m.id AS match_id, m.status, m.home_name, m.away_name,
             m.home_score, m.away_score
      FROM tournaments t
      LEFT JOIN LATERAL (
        SELECT * FROM matches
        WHERE tournament_id = t.id
        ORDER BY (status = 'live') DESC, updated_at DESC
        LIMIT 1
      ) m ON true
      WHERE t.id = ${id}
    `;

    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const body: Snapshot<TournamentSnapshot> = {
      streamId: `tournament:${id}`,
      version: Number(row.version),
      generatedAt: new Date().toISOString(),
      data: {
        tournament: { id: row.id, slug: row.slug, name: row.name },
        match: row.match_id
          ? {
              id: row.match_id,
              status: row.status ?? "scheduled",
              homeName: row.home_name ?? "",
              awayName: row.away_name ?? "",
              homeScore: row.home_score ?? 0,
              awayScore: row.away_score ?? 0,
            }
          : null,
      },
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
