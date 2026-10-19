"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { query } from "@/lib/db";
import { isBloodType } from "@/lib/blood";
import { alertMatchingDonors } from "@/lib/matching";
import { createSession, destroySession, requireHospital } from "@/lib/session";

export type FormState = { error?: string; fields?: Record<string, string> };

// Sent back with errors so the form can refill what the user typed
// (React clears a form after its action runs).
function fieldsOf(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
}

export async function loginHospital(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [hospital] = await query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM hospitals WHERE email = $1",
    [email],
  );
  if (!hospital || !(await bcrypt.compare(password, hospital.password_hash))) {
    return { error: "Wrong email or password.", fields: { email } };
  }

  await createSession("hospital", hospital.id);
  redirect("/hospital");
}

export async function logoutHospital() {
  await destroySession("hospital");
  redirect("/hospital/login");
}

export async function createRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const hospital = await requireHospital();
  const bloodType = String(formData.get("blood_type"));
  const units = Number(formData.get("units_needed"));
  const urgency = formData.get("urgency") === "critical" ? "critical" : "urgent";
  const radius = Number(formData.get("radius_km"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!isBloodType(bloodType)) return { error: "Choose the patient's blood type.", fields: fieldsOf(formData) };
  if (!Number.isInteger(units) || units < 1 || units > 20) return { error: "Units must be 1–20.", fields: fieldsOf(formData) };
  if (!Number.isFinite(radius) || radius < 1 || radius > 500) return { error: "Radius must be 1–500 km.", fields: fieldsOf(formData) };

  const [request] = await query<{ id: number }>(
    `INSERT INTO blood_requests (hospital_id, patient_blood_type, units_needed, urgency, radius_km, note)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [hospital.id, bloodType, units, urgency, radius, note],
  );
  await alertMatchingDonors(request.id);
  redirect(`/hospital/requests/${request.id}`);
}

// Loads a request only if it belongs to the logged-in hospital.
async function ownRequest(formData: FormData) {
  const hospital = await requireHospital();
  const [request] = await query<{ id: number; radius_km: number; status: string }>(
    "SELECT id, radius_km, status FROM blood_requests WHERE id = $1 AND hospital_id = $2",
    [Number(formData.get("request_id")), hospital.id],
  );
  if (!request) throw new Error("Request not found");
  return request;
}

// Not enough donors nearby? Widen the circle and alert the new donors it covers.
export async function expandSearch(formData: FormData) {
  const request = await ownRequest(formData);
  if (request.status !== "open") return;
  await query("UPDATE blood_requests SET radius_km = $1 WHERE id = $2", [
    request.radius_km * 2,
    request.id,
  ]);
  await alertMatchingDonors(request.id);
  refresh();
}

export async function closeRequest(formData: FormData) {
  const request = await ownRequest(formData);
  const status = formData.get("status") === "cancelled" ? "cancelled" : "fulfilled";
  await query(
    "UPDATE blood_requests SET status = $1, closed_at = now() WHERE id = $2 AND status = 'open'",
    [status, request.id],
  );
  refresh();
}

// The donor came in and donated: record it so they aren't alerted for 90 days.
export async function markDonated(formData: FormData) {
  const request = await ownRequest(formData);
  const [alert] = await query<{ donor_id: number }>(
    `UPDATE alerts SET response = 'donated'
     WHERE id = $1 AND request_id = $2 AND response = 'accepted'
     RETURNING donor_id`,
    [Number(formData.get("alert_id")), request.id],
  );
  if (alert) {
    await query("UPDATE donors SET last_donation_date = current_date WHERE id = $1", [alert.donor_id]);
  }
  refresh();
}
