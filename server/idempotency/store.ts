import "server-only";

import { createHash } from "node:crypto";

import type { Database } from "@/server/db/client";

type Claim =
  | { kind: "acquired" }
  | { kind: "conflict" }
  | { kind: "in-progress" }
  | { kind: "replay"; status: number; body: unknown };

export function hashRequest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function claimIdempotency(
  sql: Database,
  input: { actorId: string; operation: string; key: string; requestHash: string },
): Promise<Claim> {
  const inserted = await sql`
    INSERT INTO idempotency_keys
      (actor_id, operation, key, request_hash, status, expires_at)
    VALUES
      (${input.actorId}, ${input.operation}, ${input.key}, ${input.requestHash}, 'processing', now() + interval '24 hours')
    ON CONFLICT (actor_id, operation, key) DO UPDATE
      SET request_hash = EXCLUDED.request_hash,
          status = 'processing',
          response_status = NULL,
          response_body = NULL,
          expires_at = EXCLUDED.expires_at,
          created_at = now()
      WHERE idempotency_keys.expires_at <= now()
    RETURNING key
  `;
  if (inserted.length === 1) return { kind: "acquired" };

  const [existing] = await sql<
    { request_hash: string; status: "processing" | "completed"; response_status: number | null; response_body: unknown }[]
  >`
    SELECT request_hash, status, response_status, response_body
    FROM idempotency_keys
    WHERE actor_id = ${input.actorId}
      AND operation = ${input.operation}
      AND key = ${input.key}
  `;

  if (!existing || existing.request_hash !== input.requestHash) return { kind: "conflict" };
  if (existing.status === "processing") return { kind: "in-progress" };
  return { kind: "replay", status: existing.response_status ?? 200, body: existing.response_body };
}

export async function abandonIdempotency(
  sql: Database,
  input: { actorId: string; operation: string; key: string },
): Promise<void> {
  await sql`
    DELETE FROM idempotency_keys
    WHERE actor_id = ${input.actorId}
      AND operation = ${input.operation}
      AND key = ${input.key}
      AND status = 'processing'
  `;
}
