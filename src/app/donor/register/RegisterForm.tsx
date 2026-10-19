"use client";

import { useActionState } from "react";
import { BLOOD_TYPES } from "@/lib/blood";
import { LocationPicker } from "@/components/LocationPicker";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { registerDonor, type FormState } from "../actions";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerDonor, {} as FormState);
  const f = state.fields ?? {};

  return (
    <form action={formAction} className="space-y-5" key={JSON.stringify(f)}>
      <div>
        <label htmlFor="name" className="label">Full name</label>
        <input id="name" name="name" defaultValue={f.name} className="input" required autoComplete="name" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" defaultValue={f.email} className="input" required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Phone (for SMS alerts)</label>
          <input id="phone" name="phone" type="tel" defaultValue={f.phone} className="input" required placeholder="17123456" autoComplete="tel" />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="blood_type" className="label">Blood type</label>
          <select id="blood_type" name="blood_type" className="input" required defaultValue={f.blood_type ?? ""}>
            <option value="" disabled>Select…</option>
            {BLOOD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="last_donation_date" className="label">Last donation (if any)</label>
          <input id="last_donation_date" name="last_donation_date" type="date" defaultValue={f.last_donation_date} className="input" />
        </div>
      </div>
      <LocationPicker
        initial={f.latitude ? { latitude: f.latitude, longitude: f.longitude, label: f.location_label } : undefined}
      />
      <FormMessage state={state} />
      <SubmitButton pendingText="Creating account…" className="btn-primary w-full">
        Create donor account
      </SubmitButton>
    </form>
  );
}
