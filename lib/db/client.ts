import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

// For serverless/edge environments and long-running connections
let sqlClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  if (connectionString) {
    try {
      sqlClient = postgres(connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
      });
      dbInstance = drizzle(sqlClient, { schema });
      return dbInstance;
    } catch (err) {
      console.warn("Could not connect to PostgreSQL via connection string, using fallback.", err);
    }
  }

  return null;
}

export const db = getDb();
export { schema };
