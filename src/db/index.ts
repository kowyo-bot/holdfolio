import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as {
  __pool?: pg.Pool;
};

const pool =
  globalForDb.__pool ??
  new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__pool = pool;

export const db = drizzle(pool);
