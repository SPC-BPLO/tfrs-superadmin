import { Pool } from "pg";

const globalForPool = globalThis as unknown as { tfrsPool?: Pool };

function createPool() {
  const connectionString = process.env.USER_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("USER_DATABASE_URL is not configured");
  const useSharedDatabase = Boolean(process.env.USER_DATABASE_URL);
  return new Pool({
    connectionString,
    ssl: (useSharedDatabase ? process.env.USER_DATABASE_SSL : process.env.DATABASE_SSL) === "true"
      ? { rejectUnauthorized: false }
      : undefined,
    max: 5,
  });
}

export const db = globalForPool.tfrsPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForPool.tfrsPool = db;
