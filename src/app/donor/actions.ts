"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { query } from "@/lib/db";
import { isBloodType } from "@/lib/blood";
import { appUrl, sendEmail, sendSms } from "@/lib/notify";
import { createSession, destroySession, newToken, requireDonor } from "@/lib/session";

export type FormState = { error?: string; success?: string; fields?: Record<string, string> };

const MIN_PASSWORD = 8;

// Sent back with errors so the form can refill what the user typed
// (React clears a form after its action runs). Passwords are never sent back.
function fieldsOf(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(
      ([key, v]) => typeof v === "string" && !key.includes("password"),
    ) as [string, string][],
  );
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// Bhutan numbers: 8 digits starting with 17 or 77 (mobile). Stored as +975XXXXXXXX.
function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  if (/^\d{8}$/.test(digits)) return `+975${digits}`;
  return null;
}

function readLocation(formData: FormData) {
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const label = text(formData, "location_label");
  const valid =
    formData.get("latitude") !== "" &&
    Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) && Math.abs(longitude) <= 180;
  return valid ? { latitude, longitude, label: label || "Custom location" } : null;
}

// Finds a donor by email or phone number (whichever the user typed).
async function findDonor(contact: string) {
  const [donor] = await query<{ id: number; name: string; email: string; phone: string; password_hash: string }>(
    "SELECT id, name, email, phone, password_hash FROM donors WHERE email = $1 OR phone = $2",
    [contact.toLowerCase(), normalizePhone(contact)],
  );
  return donor;
}

export async function registerDonor(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const phone = normalizePhone(text(formData, "phone"));
  const password = String(formData.get("password") ?? "");
  const bloodType = text(formData, "blood_type");
  const lastDonation = text(formData, "last_donation_date") || null;
  const location = readLocation(formData);
  const fail = (error: string) => ({ error, fields: fieldsOf(formData) });

  if (!name) return fail("Please enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Please enter a valid email.");
  if (!phone) return fail("Please enter a valid phone number, e.g. 17123456.");
  if (password.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters.`);
  if (!isBloodType(bloodType)) return fail("Please choose your blood type.");
  if (!location) return fail("Please choose your location.");

  const existing = await query("SELECT 1 FROM donors WHERE email = $1 OR phone = $2", [email, phone]);
  if (existing.length) return fail("This email or phone is already registered. Please log in instead.");

  const [donor] = await query<{ id: number }>(
    `INSERT INTO donors (name, email, phone, password_hash, blood_type, latitude, longitude,
                         location_label, last_donation_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      name, email, phone, await bcrypt.hash(password, 10), bloodType,
      location.latitude, location.longitude, location.label, lastDonation,
    ],
  );
  await createSession("donor", donor.id);
  redirect("/donor");
}

export async function loginDonor(_prev: FormState, formData: FormData): Promise<FormState> {
  const contact = text(formData, "contact");
  const password = String(formData.get("password") ?? "");
  const donor = contact ? await findDonor(contact) : undefined;

  if (!donor || !(await bcrypt.compare(password, donor.password_hash))) {
    return { error: "Wrong email/phone or password.", fields: { contact } };
  }
  await createSession("donor", donor.id);
  redirect("/donor");
}

// "Forgot password": email + text a one-time sign-in link.
export async function requestLoginLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const contact = text(formData, "contact");
  if (!contact) return { error: "Enter your email or phone number." };

  const donor = await findDonor(contact);
  if (donor) {
    const token = newToken();
    await query(
      `INSERT INTO login_tokens (token, donor_id, expires_at) VALUES ($1, $2, now() + interval '30 minutes')`,
      [token, donor.id],
    );
    const link = appUrl(`/donor/verify/${token}`);
    await Promise.all([
      sendEmail(
        donor.email,
        "Your Blood SOS sign-in link",
        `Hi ${donor.name},\n\nUse this link to sign in to Blood SOS:\n${link}\n\n` +
          `It expires in 30 minutes. You can set a new password from your dashboard.\n` +
          `If you didn't ask for this, you can ignore this email.`,
      ),
      sendSms(donor.phone, `[Blood SOS] Your sign-in link (valid 30 min): ${link}`),
    ]);
  }

  // Same message either way, so nobody can check who is registered.
  return { success: "If that email or phone is registered, a sign-in link is on its way." };
}

export async function confirmLogin(formData: FormData) {
  const [row] = await query<{ donor_id: number }>(
    `UPDATE login_tokens SET used_at = now()
     WHERE token = $1 AND used_at IS NULL AND expires_at > now()
     RETURNING donor_id`,
    [text(formData, "token")],
  );
  if (!row) redirect("/donor/login?expired=1");

  await createSession("donor", row.donor_id);
  redirect("/donor");
}

export async function updateDonor(_prev: FormState, formData: FormData): Promise<FormState> {
  const donor = await requireDonor();
  const location = readLocation(formData);
  const newPassword = String(formData.get("new_password") ?? "");
  if (!location) return { error: "Please choose your location." };
  if (newPassword && newPassword.length < MIN_PASSWORD) {
    return { error: `New password must be at least ${MIN_PASSWORD} characters.` };
  }

  await query(
    `UPDATE donors
     SET is_available = $1, last_donation_date = $2, latitude = $3, longitude = $4, location_label = $5
     WHERE id = $6`,
    [
      formData.get("is_available") === "on",
      text(formData, "last_donation_date") || null,
      location.latitude,
      location.longitude,
      location.label,
      donor.id,
    ],
  );
  if (newPassword) {
    await query("UPDATE donors SET password_hash = $1 WHERE id = $2", [
      await bcrypt.hash(newPassword, 10),
      donor.id,
    ]);
  }
  refresh();
  return { success: newPassword ? "Saved. Your password has been changed." : "Saved." };
}

export async function logoutDonor() {
  await destroySession("donor");
  redirect("/donor/login");
}
