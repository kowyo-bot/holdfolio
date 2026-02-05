import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/lib/env";
import { schema } from "@/db/schema/schema";

const globalForDb = globalThis as unknown as {
  __pool?: Pool;
};

const pool =
  globalForDb.__pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
