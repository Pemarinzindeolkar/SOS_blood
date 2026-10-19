import Link from "next/link";
import { ChevronRight, Siren } from "lucide-react";
import { query } from "@/lib/db";
import { requireHospital } from "@/lib/session";
import { StatusBadge } from "@/components/StatusBadge";
import { NewRequestForm } from "./NewRequestForm";

type RequestRow = {
  id: number;
  patient_blood_type: string;
  units_needed: number;
  urgency: string;
  status: string;
  created_at: Date;
  alerted: number;
  accepted: number;
};

export default async function HospitalDashboard() {
  const hospital = await requireHospital();
  const requests = await query<RequestRow>(
    `SELECT r.id, r.patient_blood_type, r.units_needed, r.urgency, r.status, r.created_at,
            count(a.id)::int AS alerted,
            count(a.id) FILTER (WHERE a.response IN ('accepted', 'donated'))::int AS accepted
     FROM blood_requests r
     LEFT JOIN alerts a ON a.request_id = r.id
     WHERE r.hospital_id = $1
     GROUP BY r.id
     ORDER BY (r.status = 'open') DESC, r.created_at DESC`,
    [hospital.id],
  );
  const openCount = requests.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{hospital.name}</h1>
        <p className="text-slate-600">{hospital.address}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-2">
          <h2 className="section-title flex items-center gap-2">
            <Siren className="h-5 w-5 text-red-700" /> Raise a blood SOS
          </h2>
          <p className="mb-5 mt-1 text-sm text-slate-600">
            Matching donors nearby are alerted by SMS and email immediately.
          </p>
          <NewRequestForm />
        </section>

        <section className="card lg:col-span-3">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="section-title">Requests</h2>
            <span className="text-sm text-slate-500">{openCount} open</span>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-500">No requests yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/hospital/requests/${r.id}`}
                    className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 hover:bg-slate-50"
                  >
                    <span className="w-12 text-center text-xl font-semibold text-red-700">
                      {r.patient_blood_type}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        SOS #{r.id} · {r.units_needed} unit{r.units_needed > 1 ? "s" : ""}
                        {r.urgency === "critical" && <span className="ml-2 text-sm text-red-700">Critical</span>}
                      </span>
                      <span className="block text-sm text-slate-500">
                        {r.created_at.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                        {" · "}
                        {r.alerted} alerted · {r.accepted} coming
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
