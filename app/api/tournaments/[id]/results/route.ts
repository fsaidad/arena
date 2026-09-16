import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { findDemoSession } from "@/server/auth/demo-session";
import { getDatabase } from "@/server/db/client";
import {
  abandonIdempotency,
  claimIdempotency,
  completeIdempotency,
  hashRequest,
} from "@/server/idempotency/store";

export const runtime = "nodejs";

const resultSchema = z.object({
  matchId: z.string().min(1).max(100),
  homeScore: z.number().int().min(0).max(999),
  awayScore: z.number().int().min(0).max(999),
  expectedVersion: z.number().int().nonnegative(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey || idempotencyKey.length > 200) {
    return NextResponse.json({ error: "idempotency_key_required" }, { status: 400 });
  }

  const parsed = resultSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { id: tournamentId } = await context.params;
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("arena_demo="))
    ?.slice("arena_demo=".length);
  let sql: ReturnType<typeof getDatabase>;
  let session: Awaited<ReturnType<typeof findDemoSession>>;
  try {
    sql = getDatabase();
    session = await findDemoSession(sql, cookie ? decodeURIComponent(cookie) : undefined);
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const operation = `publish-result:${tournamentId}`;
  let claim: Awaited<ReturnType<typeof claimIdempotency>>;
  try {
    claim = await claimIdempotency(sql, {
      actorId: session.actorId,
      operation,
      key: idempotencyKey,
      requestHash: hashRequest(parsed.data),
    });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
  if (claim.kind === "replay") return NextResponse.json(claim.body, { status: claim.status });
  if (claim.kind === "conflict") {
    return NextResponse.json({ error: "idempotency_key_conflict" }, { status: 409 });
  }
  if (claim.kind === "in-progress") {
    return NextResponse.json({ error: "request_in_progress" }, { status: 409 });
  }

  try {
    const correlationId = randomUUID();
    const responseBody = await sql.begin(async (tx) => {
      const [tournament] = await tx<{ version: string }[]>`
        SELECT version::text
        FROM tournaments
        WHERE id = ${tournamentId}
        FOR UPDATE
      `;
      if (!tournament) throw new Error("not_found");
      if (Number(tournament.version) !== parsed.data.expectedVersion) throw new Error("version_conflict");

      const nextVersion = parsed.data.expectedVersion + 1;
      const [match] = await tx<{ id: string }[]>`
        UPDATE matches
        SET home_score = ${parsed.data.homeScore},
            away_score = ${parsed.data.awayScore},
            status = 'completed',
            version = ${nextVersion},
            updated_at = now()
        WHERE id = ${parsed.data.matchId} AND tournament_id = ${tournamentId}
        RETURNING id
      `;
      if (!match) throw new Error("match_not_found");

      await tx`
        UPDATE tournaments SET version = ${nextVersion}, updated_at = now() WHERE id = ${tournamentId}
      `;
      const payload = {
        matchId: match.id,
        homeScore: parsed.data.homeScore,
        awayScore: parsed.data.awayScore,
        status: "completed",
      };
      await tx`
        INSERT INTO event_log
          (stream_id, sequence, aggregate_version, type, correlation_id, payload)
        VALUES
          (${`tournament:${tournamentId}`}, ${nextVersion}, ${nextVersion}, 'match.result_published',
           ${correlationId}, ${tx.json(payload)})
      `;
      await tx`
        INSERT INTO audit_log (tournament_id, actor_id, action, correlation_id, metadata)
        VALUES (${tournamentId}, ${session.actorId}, 'match.result_published', ${correlationId},
                ${tx.json({ matchId: match.id })})
      `;

      return { tournamentId, version: nextVersion, correlationId, match: payload };
    });

    await completeIdempotency(sql, {
      actorId: session.actorId,
      operation,
      key: idempotencyKey,
      status: 200,
      body: responseBody,
    });
    return NextResponse.json(responseBody);
  } catch (error) {
    await abandonIdempotency(sql, { actorId: session.actorId, operation, key: idempotencyKey });
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "not_found" || message === "match_not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (message === "version_conflict") {
      return NextResponse.json({ error: "version_conflict" }, { status: 409 });
    }
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
