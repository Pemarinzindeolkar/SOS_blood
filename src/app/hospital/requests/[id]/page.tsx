import Link from "next/link";
import { ChevronLeft, CircleCheck, Search, TriangleAlert, X } from "lucide-react";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { requireHospital } from "@/lib/session";
import { compatibleDonorTypes, type BloodType } from "@/lib/blood";
import { AutoRefresh } from "@/components/AutoRefresh";
import { SubmitButton } from "@/components/SubmitButton";
import { StatusBadge } from "@/components/StatusBadge";
import { closeRequest, expandSearch, markDonated } from "../../actions";

type Request = {
  id: number;
  patient_blood_type: BloodType;
  units_needed: number;
  urgency: string;
  note: string | null;
  radius_km: number;
  status: string;
  created_at: Date;
};

type AlertRow = {
  id: number;
  response: string;
  distance_km: number;
  responded_at: Date | null;
  name: string;
  phone: string;
  blood_type: string;
};

export default async function RequestPage({ params }: PageProps<"/hospital/requests/[id]">) {
  const hospital = await requireHospital();
  const { id } = await params;

  const [request] = await query<Request>(
    `SELECT id, patient_blood_type, units_needed, urgency, note, radius_km, status, created_at
     FROM blood_requests WHERE id = $1 AND hospital_id = $2`,
    [Number(id) || 0, hospital.id],
  );
  if (!request) notFound();

  const alerts = await query<AlertRow>(
    `SELECT a.id, a.response, a.distance_km, a.responded_at, d.name, d.phone, d.blood_type
     FROM alerts a JOIN donors d ON d.id = a.donor_id
     WHERE a.request_id = $1
     ORDER BY CASE a.response WHEN 'accepted' THEN 0 WHEN 'donated' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
              a.distance_km`,
    [request.id],
  );

  const coming = alerts.filter((a) => a.response === "accepted" || a.response === "donated");
  const isOpen = request.status === "open";
  const hidden = <input type="hidden" name="request_id" value={request.id} />;

  return (
    <div className="space-y-6">
      {isOpen && <AutoRefresh seconds={10} />}
      <Link href="/hospital" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ChevronLeft className="h-4 w-4" /> All requests
      </Link>

      <div className="card flex flex-wrap items-center gap-6">
        <div className="text-5xl font-semibold tracking-tight text-red-700">{request.patient_blood_type}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">SOS #{request.id}</h1>
            <StatusBadge status={request.status} />
            {request.urgency === "critical" && <span className="badge bg-red-700 text-white">Critical</span>}
          </div>
          <p className="text-slate-600">
            {request.units_needed} unit{request.units_needed > 1 ? "s" : ""} needed · within {request.radius_km} km ·
            accepts {compatibleDonorTypes(request.patient_blood_type).join(", ")}
          </p>
          <p className="text-sm text-slate-500">
            Raised {request.created_at.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            {request.note && ` · ${request.note}`}
          </p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-semibold">
            {coming.length}
            <span className="text-xl text-slate-400">/{request.units_needed}</span>
          </p>
          <p className="text-sm text-slate-500">donors coming</p>
        </div>
      </div>

      {isOpen && (
        <div className="flex flex-wrap gap-3">
          <form action={expandSearch}>
            {hidden}
            <SubmitButton className="btn-secondary" pendingText="Searching…">
              <Search className="h-4 w-4" /> Widen search to {request.radius_km * 2} km
            </SubmitButton>
          </form>
          <form action={closeRequest}>
            {hidden}
            <SubmitButton className="btn-primary" name="status" value="fulfilled" pendingText="Closing…">
              <CircleCheck className="h-4 w-4" /> Mark fulfilled
            </SubmitButton>
          </form>
          <form action={closeRequest}>
            {hidden}
            <SubmitButton className="btn-secondary" name="status" value="cancelled" pendingText="Cancelling…">
              <X className="h-4 w-4" /> Cancel request
            </SubmitButton>
          </form>
        </div>
      )}

      <section className="card">
        <h2 className="section-title mb-1">Donors alerted ({alerts.length})</h2>
        <p className="mb-4 text-sm text-slate-500">
          Phone numbers appear only after a donor accepts.
          {isOpen && " This page refreshes automatically."}
        </p>
        {alerts.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            No eligible donors found within {request.radius_km} km yet. Try widening the search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Donor</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Distance</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Contact</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((a) => {
                  const revealed = a.response === "accepted" || a.response === "donated";
                  return (
                    <tr key={a.id}>
                      <td className="py-3 pr-4 font-medium">{revealed ? a.name : "Donor"}</td>
                      <td className="py-3 pr-4">{a.blood_type}</td>
                      <td className="py-3 pr-4">{a.distance_km.toFixed(1)} km</td>
                      <td className="py-3 pr-4"><StatusBadge status={a.response} /></td>
                      <td className="py-3 pr-4">
                        {revealed ? (
                          <a href={`tel:${a.phone}`} className="text-red-700 hover:underline">{a.phone}</a>
                        ) : (
                          <span className="text-slate-400">hidden</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {a.response === "accepted" && (
                          <form action={markDonated}>
                            {hidden}
                            <input type="hidden" name="alert_id" value={a.id} />
                            <SubmitButton className="btn-secondary px-3 py-1 text-xs" pendingText="…">
                              Mark donated
                            </SubmitButton>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
