import { notFound } from "next/navigation";
import { CircleCheck, MapPin, Navigation, Phone } from "lucide-react";
import { query } from "@/lib/db";
import { SubmitButton } from "@/components/SubmitButton";
import { respondToAlert } from "./actions";

type AlertDetails = {
  response: string;
  distance_km: number;
  donor_name: string;
  patient_blood_type: string;
  units_needed: number;
  urgency: string;
  status: string;
  hospital_name: string;
  hospital_address: string;
  hospital_phone: string;
  latitude: number;
  longitude: number;
};

// Opened from the SOS magic link in the donor's SMS / email. The token in the
// link identifies the donor, so no login is needed.
export default async function RespondPage({ params }: PageProps<"/donor/respond/[token]">) {
  const { token } = await params;
  const [alert] = await query<AlertDetails>(
    `SELECT a.response, a.distance_km, d.name AS donor_name,
            r.patient_blood_type, r.units_needed, r.urgency, r.status,
            h.name AS hospital_name, h.address AS hospital_address, h.phone AS hospital_phone,
            h.latitude, h.longitude
     FROM alerts a
     JOIN donors d ON d.id = a.donor_id
     JOIN blood_requests r ON r.id = a.request_id
     JOIN hospitals h ON h.id = r.hospital_id
     WHERE a.token = $1`,
    [token],
  );
  if (!alert) notFound();

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`;
  const accepted = alert.response === "accepted" || alert.response === "donated";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="card text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-red-700">
          {alert.urgency === "critical" ? "Critical blood request" : "Urgent blood request"}
        </p>
        <p className="mt-1 text-slate-600">Hi {alert.donor_name}, a patient needs</p>
        <p className="my-2 text-6xl font-semibold tracking-tight text-red-700">{alert.patient_blood_type}</p>
        <p className="text-slate-600">
          {alert.units_needed} unit{alert.units_needed > 1 ? "s" : ""} of blood
        </p>
        <div className="mt-5 flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-left">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <div>
            <p className="font-medium">{alert.hospital_name}</p>
            <p className="text-sm text-slate-600">{alert.hospital_address}</p>
            <p className="text-sm text-slate-500">About {alert.distance_km.toFixed(1)} km from you</p>
          </div>
        </div>
      </div>

      {alert.status !== "open" ? (
        <div className="card text-center">
          <p className="font-semibold">
            {alert.status === "fulfilled" ? "This request has been fulfilled." : "This request was cancelled."}
          </p>
          <p className="mt-1 text-sm text-slate-600">Thank you for being ready to help. We&apos;ll alert you next time.</p>
        </div>
      ) : accepted ? (
        <div className="card space-y-4 text-center">
          <p className="flex items-center justify-center gap-2 font-semibold text-green-700">
            <CircleCheck className="h-5 w-5" /> Thank you. The hospital knows you&apos;re coming.
          </p>
          <p className="text-sm text-slate-600">Please go to the blood bank as soon as you can and bring your CID.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <Navigation className="h-4 w-4" /> Directions
            </a>
            <a href={`tel:${alert.hospital_phone}`} className="btn-secondary">
              <Phone className="h-4 w-4" /> Call {alert.hospital_phone}
            </a>
          </div>
          {alert.response === "accepted" && (
            <form action={respondToAlert}>
              <input type="hidden" name="token" value={token} />
              <SubmitButton className="cursor-pointer text-sm text-slate-500 underline" name="answer" value="decline" pendingText="…">
                I can no longer come
              </SubmitButton>
            </form>
          )}
        </div>
      ) : (
        <form action={respondToAlert} className="card space-y-4 text-center">
          <input type="hidden" name="token" value={token} />
          <p className="font-medium">
            {alert.response === "declined" ? "You said you can't come. Changed your mind?" : "Can you donate now?"}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <SubmitButton className="btn-primary px-8 py-2.5 text-base" name="answer" value="accept" pendingText="Sending…">
              Yes, I&apos;m coming
            </SubmitButton>
            {alert.response !== "declined" && (
              <SubmitButton className="btn-secondary px-8 py-2.5 text-base" name="answer" value="decline" pendingText="Sending…">
                Can&apos;t right now
              </SubmitButton>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
