import { Pool } from "pg";

const globalForPool = globalThis as unknown as { tfrsPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });
}

export const db = globalForPool.tfrsPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForPool.tfrsPool = db;
