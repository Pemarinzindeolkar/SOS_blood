// Adds a demo hospital and a few demo donors around Thimphu.
// Every demo account uses the password: password123
// Usage: npm run db:seed
// Local development only: these accounts have a public password.
import bcrypt from "bcryptjs";
import pg from "pg";

const host = new URL(process.env.DATABASE_URL ?? "postgres://localhost").hostname;
if (!["localhost", "127.0.0.1", "::1", ""].includes(host) && !process.argv.includes("--force")) {
  console.error(`Refusing to seed demo accounts into ${host}. Use scripts/add-hospital.mjs for real hospitals.`);
  console.error("Pass --force if you really want demo data there.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const passwordHash = await bcrypt.hash("password123", 10);
await client.query(
  `INSERT INTO hospitals (name, email, password_hash, phone, address, latitude, longitude)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   ON CONFLICT (email) DO NOTHING`,
  [
    "JDW National Referral Hospital (Blood Bank)",
    "bloodbank@demo.bt",
    passwordHash,
    "+97517000000",
    "Gongphel Lam, Thimphu",
    27.4661,
    89.6419,
  ],
);

// name, email, phone, blood type, lat, lng, label, last donation (days ago or null)
const donors = [
  ["Karma Dorji", "karma@demo.bt", "+97517111111", "O-", 27.4728, 89.639, "Thimphu", null],
  ["Sonam Choden", "sonam@demo.bt", "+97517222222", "A+", 27.4856, 89.6345, "Thimphu (Motithang)", 200],
  ["Tashi Wangmo", "tashi@demo.bt", "+97517333333", "O+", 27.4305, 89.4167, "Paro", null],
  ["Pema Lhamo", "pema@demo.bt", "+97517444444", "B+", 27.4489, 89.659, "Thimphu (Babesa)", 30],
  ["Ugyen Tenzin", "ugyen@demo.bt", "+97517555555", "AB+", 27.5916, 89.8774, "Punakha", null],
];
for (const [name, email, phone, type, lat, lng, label, daysAgo] of donors) {
  await client.query(
    `INSERT INTO donors (name, email, phone, password_hash, blood_type, latitude, longitude,
                         location_label, last_donation_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, current_date - $9::int)
     ON CONFLICT (email) DO NOTHING`,
    [name, email, phone, passwordHash, type, lat, lng, label, daysAgo],
  );
}

await client.end();
console.log("Seeded demo data.");
console.log("Hospital login: bloodbank@demo.bt / password123");
console.log("Donor login:    karma@demo.bt / password123");
