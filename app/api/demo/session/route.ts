import { NextResponse } from "next/server";
import { z } from "zod";

import { createDemoSession, demoRoles } from "@/server/auth/demo-session";
import { getDatabase } from "@/server/db/client";

export const runtime = "nodejs";

const requestSchema = z.object({ role: z.enum(demoRoles).default("viewer") });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const session = await createDemoSession(getDatabase(), parsed.data.role);
    const response = NextResponse.json({
      actorId: session.actorId,
      role: session.role,
      expiresAt: session.expiresAt,
    });
    response.cookies.set("arena_demo", session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }
}
