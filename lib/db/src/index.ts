import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

function shouldEnableSsl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const sslMode = parsedUrl.searchParams.get("sslmode");
    if (sslMode === "disable") return false;
    if (
      sslMode === "require" ||
      sslMode === "verify-ca" ||
      sslMode === "verify-full"
    ) {
      return true;
    }
  } catch {
    // Keep fallback logic for unexpected URL formats.
  }

  return process.env["PGSSLMODE"] === "require";
}

const needsSsl = shouldEnableSsl(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";