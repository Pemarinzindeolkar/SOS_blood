import Link from "next/link";
import { CircleCheck, CirclePause, Clock, MapPin, Siren } from "lucide-react";
import { query } from "@/lib/db";
import { requireDonor } from "@/lib/session";
import { DONATION_GAP_DAYS } from "@/lib/blood";
import { SubmitButton } from "@/components/SubmitButton";
import { StatusBadge } from "@/components/StatusBadge";
import { ProfileForm } from "./ProfileForm";
import { respondToAlert } from "./respond/[token]/actions";

type AlertRow = {
  token: string;
  response: string;
  sent_at: Date;
  distance_km: number;
  status: string;
  patient_blood_type: string;
  units_needed: number;
  urgency: string;
  hospital_name: string;
};

export default async function DonorPage() {
  const donor = await requireDonor();

  const [{ next_eligible }] = await query<{ next_eligible: string | null }>(
    `SELECT CASE WHEN $1::date + $2::int > current_date
                 THEN to_char($1::date + $2::int, 'DD Mon YYYY') END AS next_eligible`,
    [donor.last_donation_date, DONATION_GAP_DAYS],
  );

  const alerts = await query<AlertRow>(
    `SELECT a.token, a.response, a.sent_at, a.distance_km, r.status, r.patient_blood_type,
            r.units_needed, r.urgency, h.name AS hospital_name
     FROM alerts a
     JOIN blood_requests r ON r.id = a.request_id
     JOIN hospitals h ON h.id = r.hospital_id
     WHERE a.donor_id = $1
     ORDER BY a.sent_at DESC LIMIT 20`,
    [donor.id],
  );
  const open = alerts.filter((a) => a.status === "open" && a.response !== "donated");
  const past = alerts.filter((a) => !open.includes(a));

  const status = !donor.is_available
    ? { icon: CirclePause, label: "Paused", note: "You won't receive alerts.", tone: "text-slate-500" }
    : next_eligible
      ? { icon: Clock, label: "Resting", note: `Eligible again on ${next_eligible}`, tone: "text-amber-600" }
      : { icon: CircleCheck, label: "Ready to donate", note: "You'll be alerted when needed.", tone: "text-green-600" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {donor.name}</h1>
        <p className="text-slate-600">{donor.email} · {donor.phone}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Blood type</p>
          <p className="mt-1 text-3xl font-semibold text-red-700">{donor.blood_type}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Status</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <status.icon className={`h-5 w-5 ${status.tone}`} /> {status.label}
          </p>
          <p className="text-sm text-slate-500">{status.note}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Location</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-slate-400" /> {donor.location_label}
          </p>
        </div>
      </div>

      {open.length > 0 && (
        <section className="card border-red-200">
          <h2 className="section-title flex items-center gap-2 text-red-700">
            <Siren className="h-5 w-5" /> Open SOS requests ({open.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {open.map((a) => (
              <li key={a.token} className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 p-4">
                <span className="w-14 text-center text-2xl font-semibold text-red-700">{a.patient_blood_type}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {a.hospital_name}
                    {a.urgency === "critical" && <span className="badge ml-2 bg-red-700 text-white">Critical</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {a.units_needed} unit{a.units_needed > 1 ? "s" : ""} · {a.distance_km.toFixed(1)} km away ·{" "}
                    <Link href={`/donor/respond/${a.token}`} className="text-red-700 hover:underline">Details</Link>
                  </p>
                </div>
                {a.response === "accepted" ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                    <CircleCheck className="h-4 w-4" /> You&apos;re going
                  </span>
                ) : (
                  <form action={respondToAlert} className="flex gap-2">
                    <input type="hidden" name="token" value={a.token} />
                    <SubmitButton name="answer" value="accept" pendingText="…">I can donate</SubmitButton>
                    {a.response === "pending" && (
                      <SubmitButton name="answer" value="decline" className="btn-secondary" pendingText="…">
                        Not now
                      </SubmitButton>
                    )}
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="section-title mb-4">My details</h2>
          <ProfileForm donor={donor} />
        </section>

        <section className="card">
          <h2 className="section-title mb-4">Alert history</h2>
          {past.length === 0 ? (
            <p className="text-sm text-slate-500">
              No past alerts. We&apos;ll text and email you when your blood type is needed nearby.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {past.map((a) => (
                <li key={a.token} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{a.patient_blood_type} · {a.hospital_name}</p>
                    <p className="text-sm text-slate-500">
                      {a.sent_at.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <StatusBadge status={a.response === "pending" ? a.status : a.response} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
