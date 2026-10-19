import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "./db";
import type { BloodType } from "./blood";

const SESSION_DAYS = 30;

type Role = "donor" | "hospital";

// Each portal has its own cookie, so you can be logged in as a donor and a
// hospital at the same time in one browser (handy for testing).
const cookieName = (role: Role) => `bsos_${role}`;

export type Hospital = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type Donor = {
  id: number;
  name: string;
  email: string;
  phone: string;
  blood_type: BloodType;
  latitude: number;
  longitude: number;
  location_label: string;
  last_donation_date: string | null;
  is_available: boolean;
};

// Random, URL-safe token used for sessions and magic links.
export function newToken() {
  return randomBytes(32).toString("base64url");
}

export async function createSession(role: Role, userId: number) {
  const token = newToken();
  const [{ expires_at }] = await query<{ expires_at: Date }>(
    `INSERT INTO sessions (token, role, user_id, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(days => $4))
     RETURNING expires_at`,
    [token, role, userId, SESSION_DAYS],
  );
  const cookieStore = await cookies();
  cookieStore.set(cookieName(role), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expires_at,
  });
}

// Returns the logged-in user's id for this portal, or null.
async function getUserId(role: Role): Promise<number | null> {
  const token = (await cookies()).get(cookieName(role))?.value;
  if (!token) return null;
  const [row] = await query<{ user_id: number }>(
    "SELECT user_id FROM sessions WHERE token = $1 AND role = $2 AND expires_at > now()",
    [token, role],
  );
  return row?.user_id ?? null;
}

export async function destroySession(role: Role) {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName(role))?.value;
  if (token) await query("DELETE FROM sessions WHERE token = $1", [token]);
  cookieStore.delete(cookieName(role));
}

export async function getHospital(): Promise<Hospital | null> {
  const id = await getUserId("hospital");
  if (!id) return null;
  const [hospital] = await query<Hospital>(
    "SELECT id, name, email, phone, address, latitude, longitude FROM hospitals WHERE id = $1",
    [id],
  );
  return hospital ?? null;
}

export async function getDonor(): Promise<Donor | null> {
  const id = await getUserId("donor");
  if (!id) return null;
  const [donor] = await query<Donor>(
    `SELECT id, name, email, phone, blood_type, latitude, longitude, location_label,
            last_donation_date, is_available
     FROM donors WHERE id = $1`,
    [id],
  );
  return donor ?? null;
}

// Use at the top of hospital pages and actions. Redirects to login if needed.
export async function requireHospital(): Promise<Hospital> {
  return (await getHospital()) ?? redirect("/hospital/login");
}

// Use at the top of donor pages and actions. Redirects to login if needed.
export async function requireDonor(): Promise<Donor> {
  return (await getDonor()) ?? redirect("/donor/login");
}
