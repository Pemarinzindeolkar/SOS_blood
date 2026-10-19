import { query } from "./db";
import { compatibleDonorTypes, DONATION_GAP_DAYS, type BloodType } from "./blood";
import { appUrl, sendEmail, sendSms } from "./notify";
import { newToken } from "./session";

type OpenRequest = {
  id: number;
  patient_blood_type: BloodType;
  units_needed: number;
  urgency: "critical" | "urgent";
  radius_km: number;
  status: string;
  hospital_name: string;
  hospital_address: string;
  latitude: number;
  longitude: number;
};

type MatchedDonor = {
  id: number;
  name: string;
  email: string;
  phone: string;
  distance_km: number;
};

// Finds every donor who can help with this request and hasn't been alerted
// yet, then emails + texts each one a magic link. Returns how many were alerted.
//
// A donor matches when they are: available, have a compatible blood type,
// haven't donated in the last 90 days, and live within the radius.
export async function alertMatchingDonors(requestId: number): Promise<number> {
  const [request] = await query<OpenRequest>(
    `SELECT r.id, r.patient_blood_type, r.units_needed, r.urgency, r.radius_km, r.status,
            h.name AS hospital_name, h.address AS hospital_address, h.latitude, h.longitude
     FROM blood_requests r JOIN hospitals h ON h.id = r.hospital_id
     WHERE r.id = $1`,
    [requestId],
  );
  if (!request || request.status !== "open") return 0;

  // Distance uses the haversine formula (great-circle distance in km).
  const donors = await query<MatchedDonor>(
    `SELECT * FROM (
       SELECT d.id, d.name, d.email, d.phone,
              6371 * 2 * asin(sqrt(
                power(sin(radians(d.latitude - $1::float8) / 2), 2) +
                cos(radians($1::float8)) * cos(radians(d.latitude)) *
                power(sin(radians(d.longitude - $2::float8) / 2), 2)
              )) AS distance_km
       FROM donors d
       WHERE d.is_available
         AND d.blood_type = ANY($3::text[])
         AND (d.last_donation_date IS NULL OR d.last_donation_date <= current_date - $4::int)
         AND NOT EXISTS (SELECT 1 FROM alerts a WHERE a.request_id = $5 AND a.donor_id = d.id)
     ) matches
     WHERE distance_km <= $6
     ORDER BY distance_km`,
    [
      request.latitude,
      request.longitude,
      compatibleDonorTypes(request.patient_blood_type),
      DONATION_GAP_DAYS,
      request.id,
      request.radius_km,
    ],
  );

  await Promise.all(donors.map((donor) => alertDonor(request, donor)));
  return donors.length;
}

async function alertDonor(request: OpenRequest, donor: MatchedDonor) {
  const token = newToken();
  await query(
    `INSERT INTO alerts (request_id, donor_id, token, distance_km) VALUES ($1, $2, $3, $4)`,
    [request.id, donor.id, token, donor.distance_km],
  );

  const link = appUrl(`/donor/respond/${token}`);
  const km = donor.distance_km.toFixed(1);
  const units = `${request.units_needed} unit${request.units_needed > 1 ? "s" : ""}`;
  const label = request.urgency === "critical" ? "CRITICAL" : "URGENT";

  await Promise.all([
    sendSms(
      donor.phone,
      `[Blood SOS] ${label}: ${request.hospital_name} needs ${request.patient_blood_type} blood (${units}). ` +
        `You are ~${km} km away. Can you help? Reply here: ${link}`,
    ),
    sendEmail(
      donor.email,
      `${label}: ${request.patient_blood_type} blood needed near you`,
      `Hi ${donor.name},\n\n` +
        `${request.hospital_name} urgently needs ${request.patient_blood_type} blood (${units}).\n` +
        `Hospital: ${request.hospital_address} (about ${km} km from you)\n\n` +
        `Your blood type can help. Please let them know if you can come:\n${link}\n\n` +
        `Thank you. You could save a life today.\nBlood SOS`,
    ),
  ]);
}
