import { Pool, types, type QueryResultRow } from "pg";

// Return DATE columns as plain "YYYY-MM-DD" strings instead of JS Dates,
// so they don't shift by a day because of time zones.
types.setTypeParser(1082, (value) => value);

// Reuse one pool across hot reloads in development.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

const pool = globalForPg.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params);
  return result.rows;
}
