"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { loginHospital, type FormState } from "../actions";

export function HospitalLoginForm() {
  const [state, formAction] = useActionState(loginHospital, {} as FormState);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" defaultValue={state.fields?.email} className="input" required autoComplete="username" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" className="input" required autoComplete="current-password" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Logging in…" className="btn-primary w-full">Log in</SubmitButton>
    </form>
  );
}
