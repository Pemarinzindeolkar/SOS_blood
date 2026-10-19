"use client";

import { useActionState } from "react";
import { BLOOD_TYPES } from "@/lib/blood";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { createRequest, type FormState } from "./actions";

export function NewRequestForm() {
  const [state, formAction] = useActionState(createRequest, {} as FormState);
  const f = state.fields ?? {};
  return (
    <form action={formAction} className="space-y-4" key={JSON.stringify(f)}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="blood_type" className="label">Patient blood type</label>
          <select id="blood_type" name="blood_type" className="input" required defaultValue={f.blood_type ?? ""}>
            <option value="" disabled>Select…</option>
            {BLOOD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="units_needed" className="label">Units needed</label>
          <input id="units_needed" name="units_needed" type="number" min={1} max={20} defaultValue={f.units_needed ?? 1} className="input" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="urgency" className="label">Urgency</label>
          <select id="urgency" name="urgency" className="input" defaultValue={f.urgency ?? "urgent"}>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label htmlFor="radius_km" className="label">Search radius (km)</label>
          <input id="radius_km" name="radius_km" type="number" min={1} max={500} defaultValue={f.radius_km ?? 10} className="input" required />
        </div>
      </div>
      <div>
        <label htmlFor="note" className="label">Note for internal use (optional)</label>
        <textarea id="note" name="note" rows={2} defaultValue={f.note} className="input" placeholder="e.g. Ward 3, accident case" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Alerting donors…" className="btn-primary w-full">
        Send SOS to nearby donors
      </SubmitButton>
    </form>
  );
}
