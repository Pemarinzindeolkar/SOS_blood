// Creates a verified hospital account and prints a random password for it.
// Usage:
//   npm run hospital:add -- --name "JDW National Referral Hospital" --email bloodbank@jdwnrh.bt \
//     --phone +97517000000 --address "Gongphel Lam, Thimphu" --lat 27.4661 --lng 89.6419
// To add it to the cloud database, put DATABASE_URL=<external URL> in front of the command.
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import bcrypt from "bcryptjs";
import pg from "pg";

const { values } = parseArgs({
  options: {
    name: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    address: { type: "string" },
    lat: { type: "string" },
    lng: { type: "string" },
  },
});

const missing = ["name", "email", "phone", "address", "lat", "lng"].filter((key) => !values[key]);
if (missing.length) {
  console.error(`Missing: ${missing.map((key) => `--${key}`).join(", ")}`);
  process.exit(1);
}
const lat = Number(values.lat);
const lng = Number(values.lng);
if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
  console.error("--lat and --lng must be numbers, e.g. --lat 27.4661 --lng 89.6419");
  process.exit(1);
}

const password = randomBytes(9).toString("base64url");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rowCount } = await client.query(
  `INSERT INTO hospitals (name, email, password_hash, phone, address, latitude, longitude)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   ON CONFLICT (email) DO NOTHING`,
  [values.name, values.email.toLowerCase(), await bcrypt.hash(password, 10), values.phone, values.address, lat, lng],
);
await client.end();

if (!rowCount) {
  console.error(`A hospital with email ${values.email} already exists.`);
  process.exit(1);
}
console.log(`Added ${values.name}.`);
console.log(`Login: ${values.email.toLowerCase()} / ${password}`);
console.log("Give this password to the hospital privately. It is not shown again.");
