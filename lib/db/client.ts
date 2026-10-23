import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Next.js loads .env.local itself, but standalone scripts (tsx migration/job
 * commands) do not. Load local env files before reading the connection string.
 * Platform-provided values always win over file values.
 */
function loadLocalEnvFiles() {
  for (const filename of [".env.local", ".env"]) {
    const fullPath = path.resolve(process.cwd(), filename);
    if (!fs.existsSync(fullPath)) continue;

    const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 1) continue;

      const key = line.slice(0, separator).trim();
      if (!/^[A-Z_][A-Z0-9_]*$/i.test(key) || process.env[key] !== undefined) continue;

      let value = line.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
      process.env[key] = value;
    }
  }
}

loadLocalEnvFiles();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

let sqlClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;
  if (!connectionString) return null;

  try {
    sqlClient = postgres(connectionString, {
      max: Math.max(1, Number(process.env.DB_POOL_MAX || 5)),
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      // The Supabase connection string negotiates TLS. This does not disable
      // certificate verification; postgres.js uses its normal secure defaults.
    });
    dbInstance = drizzle(sqlClient, { schema });
    return dbInstance;
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
    console.warn("Could not initialize PostgreSQL. Local JSON repositories remain available.", err);
    return null;
  }
}

export const db = getDb();
export { schema };
