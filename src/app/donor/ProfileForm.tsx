"use client";

import { useActionState } from "react";
import type { Donor } from "@/lib/session";
import { LocationPicker } from "@/components/LocationPicker";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { updateDonor, type FormState } from "./actions";

export function ProfileForm({ donor }: { donor: Donor }) {
  const [state, formAction] = useActionState(updateDonor, {} as FormState);
  return (
    <form action={formAction} className="space-y-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="is_available"
          defaultChecked={donor.is_available}
          className="mt-0.5 h-4 w-4 accent-red-700"
        />
        <span>
          <span className="text-sm font-medium">Available for SOS alerts</span>
          <span className="block text-sm text-slate-500">Untick if you&apos;re unwell, travelling or busy.</span>
        </span>
      </label>
      <div>
        <label htmlFor="last_donation_date" className="label">Last donation date</label>
        <input
          id="last_donation_date"
          name="last_donation_date"
          type="date"
          className="input"
          defaultValue={donor.last_donation_date ?? ""}
        />
      </div>
      <LocationPicker
        initial={{
          latitude: String(donor.latitude),
          longitude: String(donor.longitude),
          label: donor.location_label,
        }}
      />
      <div>
        <label htmlFor="new_password" className="label">New password (optional)</label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          className="input"
          minLength={8}
          autoComplete="new-password"
          placeholder="Leave blank to keep your current password"
        />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
