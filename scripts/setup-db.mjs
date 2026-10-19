// Creates all tables. Usage: npm run db:setup  (add --reset to drop everything first)
import { readFile } from "node:fs/promises";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

if (process.argv.includes("--reset")) {
  await client.query(
    "DROP TABLE IF EXISTS alerts, blood_requests, sessions, login_tokens, donors, hospitals CASCADE",
  );
  console.log("Dropped existing tables.");
}

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
await client.query(schema);
await client.end();
console.log("Database schema is ready.");
