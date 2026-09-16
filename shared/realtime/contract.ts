import { z } from "zod";

export const arenaEventSchema = z.object({
  eventId: z.string().uuid(),
  streamId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  schemaVersion: z.literal(1),
  aggregateVersion: z.number().int().nonnegative(),
  type: z.string().min(1),
  occurredAt: z.string().datetime(),
  correlationId: z.string().uuid(),
  payload: z.unknown(),
});

export type ArenaEvent = z.infer<typeof arenaEventSchema>;

export type Snapshot<T> = {
  streamId: string;
  version: number;
  generatedAt: string;
  data: T;
};
