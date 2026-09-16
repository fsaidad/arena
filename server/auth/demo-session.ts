import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";

import type { Database } from "@/server/db/client";

export const demoRoles = ["viewer", "operator", "admin"] as const;
export type DemoRole = (typeof demoRoles)[number];

export type DemoSession = {
  actorId: string;
  role: DemoRole;
  expiresAt: string;
};

const lifetimeHours = 8;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createDemoSession(
  sql: Database,
  role: DemoRole,
): Promise<DemoSession & { token: string }> {
  const token = randomBytes(32).toString("base64url");
  const actorId = `demo-${role}-${randomUUID().slice(0, 8)}`;
  const expiresAt = new Date(Date.now() + lifetimeHours * 60 * 60 * 1_000);

  await sql`
    INSERT INTO demo_sessions (token_hash, actor_id, role, expires_at)
    VALUES (${hashToken(token)}, ${actorId}, ${role}, ${expiresAt})
  `;

  return { token, actorId, role, expiresAt: expiresAt.toISOString() };
}

export async function findDemoSession(
  sql: Database,
  token: string | undefined,
): Promise<DemoSession | null> {
  if (!token) return null;

  const [session] = await sql<
    { actor_id: string; role: DemoRole; expires_at: Date }[]
  >`
    SELECT actor_id, role, expires_at
    FROM demo_sessions
    WHERE token_hash = ${hashToken(token)}
      AND expires_at > now()
  `;

  if (!session) return null;
  return {
    actorId: session.actor_id,
    role: session.role,
    expiresAt: session.expires_at.toISOString(),
  };
}
