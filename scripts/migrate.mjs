import { readFile } from "node:fs/promises";

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run migrations.");

const migration = await readFile(
  new URL("../server/db/migrations/0001_realtime.sql", import.meta.url),
  "utf8",
);
const sql = postgres(connectionString, { max: 1, prepare: false });

try {
  await sql.unsafe(migration);
  console.log("Applied realtime schema migration.");
} finally {
  await sql.end();
}
