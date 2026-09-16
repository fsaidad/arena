import "server-only";

import type { Database } from "@/server/db/client";
import type { ArenaEvent } from "@/shared/realtime/contract";

type EventRow = {
  event_id: string;
  stream_id: string;
  sequence: string;
  schema_version: number;
  aggregate_version: string;
  type: string;
  occurred_at: Date;
  correlation_id: string;
  payload: unknown;
};

function mapEvent(row: EventRow): ArenaEvent {
  return {
    eventId: row.event_id,
    streamId: row.stream_id,
    sequence: Number(row.sequence),
    schemaVersion: 1,
    aggregateVersion: Number(row.aggregate_version),
    type: row.type,
    occurredAt: row.occurred_at.toISOString(),
    correlationId: row.correlation_id,
    payload: row.payload,
  };
}

export async function readEventsAfter(
  sql: Database,
  streamId: string,
  sequence: number,
  limit = 250,
): Promise<ArenaEvent[]> {
  const rows = await sql<EventRow[]>`
    SELECT event_id, stream_id, sequence, schema_version, aggregate_version,
           type, occurred_at, correlation_id, payload
    FROM event_log
    WHERE stream_id = ${streamId} AND sequence > ${sequence}
    ORDER BY sequence ASC
    LIMIT ${limit}
  `;
  return rows.map(mapEvent);
}

export async function earliestSequence(sql: Database, streamId: string): Promise<number | null> {
  const [row] = await sql<{ sequence: string | null }[]>`
    SELECT min(sequence)::text AS sequence FROM event_log WHERE stream_id = ${streamId}
  `;
  return row?.sequence === null || row?.sequence === undefined ? null : Number(row.sequence);
}
