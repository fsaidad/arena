import { NextResponse } from "next/server";

import { getDatabase } from "@/server/db/client";
import { earliestSequence, readEventsAfter } from "@/server/realtime/event-store";
import type { ArenaEvent } from "@/shared/realtime/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function encodeEvent(event: ArenaEvent): Uint8Array {
  return encoder.encode(`id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

function parseCursor(request: Request): number | null {
  const url = new URL(request.url);
  const value = url.searchParams.get("after") ?? request.headers.get("last-event-id") ?? "0";
  if (!/^\d+$/.test(value)) return null;
  const cursor = Number(value);
  return Number.isSafeInteger(cursor) ? cursor : null;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const cursor = parseCursor(request);
  if (cursor === null) {
    return NextResponse.json({ error: "invalid_cursor" }, { status: 400 });
  }

  const { id } = await context.params;
  const streamId = `tournament:${id}`;
  let sql: ReturnType<typeof getDatabase>;
  try {
    sql = getDatabase();
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let nextCursor = cursor;
      let lastHeartbeat = Date.now();

      try {
        const earliest = await earliestSequence(sql, streamId);
        if (earliest !== null && nextCursor > 0 && nextCursor < earliest - 1) {
          controller.enqueue(
            encoder.encode(`event: resync_required\ndata: ${JSON.stringify({ reason: "retention_gap" })}\n\n`),
          );
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(": connected\n\n"));

        while (!request.signal.aborted) {
          const events = await readEventsAfter(sql, streamId, nextCursor);
          for (const event of events) {
            controller.enqueue(encodeEvent(event));
            nextCursor = event.sequence;
          }

          if (Date.now() - lastHeartbeat >= 15_000) {
            controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
            lastHeartbeat = Date.now();
          }

          await new Promise((resolve) => setTimeout(resolve, 1_000));
        }
        if (!request.signal.aborted) controller.close();
      } catch {
        if (!request.signal.aborted) controller.error(new Error("event_stream_unavailable"));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
