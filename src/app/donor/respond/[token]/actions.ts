"use server";

import { refresh } from "next/cache";
import { query } from "@/lib/db";
import { appUrl, sendEmail } from "@/lib/notify";

// The donor taps Accept or Decline on their magic link. The token itself is
// the proof of who they are, so no login is needed.
export async function respondToAlert(formData: FormData) {
  const token = String(formData.get("token"));
  const answer = formData.get("answer") === "accept" ? "accepted" : "declined";

  const [alert] = await query<{
    request_id: number;
    donor_name: string;
    donor_phone: string;
    blood_type: string;
    hospital_email: string;
  }>(
    `UPDATE alerts a SET response = $2, responded_at = now()
     FROM blood_requests r, donors d, hospitals h
     WHERE a.token = $1
       AND r.id = a.request_id AND d.id = a.donor_id AND h.id = r.hospital_id
       AND r.status = 'open'
       AND a.response IN ('pending', 'accepted', 'declined')
       AND a.response <> $2
     RETURNING a.request_id, d.name AS donor_name, d.phone AS donor_phone,
               d.blood_type, h.email AS hospital_email`,
    [token, answer],
  );

  if (alert && answer === "accepted") {
    await sendEmail(
      alert.hospital_email,
      `Donor on the way: ${alert.donor_name} (${alert.blood_type})`,
      `${alert.donor_name} (${alert.blood_type}, ${alert.donor_phone}) accepted SOS #${alert.request_id}.\n\n` +
        `View the request: ${appUrl(`/hospital/requests/${alert.request_id}`)}`,
    );
  }
  refresh();
}
