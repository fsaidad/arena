import "server-only";

import postgres from "postgres";

export type Database = postgres.Sql;

let database: Database | undefined;

export function getDatabase(): Database {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  database ??= postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  return database;
}
