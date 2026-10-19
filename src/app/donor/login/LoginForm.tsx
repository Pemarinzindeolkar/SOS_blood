"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { loginDonor, requestLoginLink, type FormState } from "../actions";

export function LoginForm() {
  const [forgot, setForgot] = useState(false);
  return forgot ? <MagicLinkForm onBack={() => setForgot(false)} /> : <PasswordForm onForgot={() => setForgot(true)} />;
}

function PasswordForm({ onForgot }: { onForgot: () => void }) {
  const [state, formAction] = useActionState(loginDonor, {} as FormState);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="contact" className="label">Email or phone number</label>
        <input
          id="contact"
          name="contact"
          defaultValue={state.fields?.contact}
          className="input"
          required
          autoComplete="username"
          placeholder="you@example.com or 17123456"
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="label">Password</label>
          <button type="button" onClick={onForgot} className="text-sm text-red-700 hover:underline">
            Forgot password?
          </button>
        </div>
        <input id="password" name="password" type="password" className="input" required autoComplete="current-password" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Logging in…" className="btn-primary w-full">Log in</SubmitButton>
    </form>
  );
}

function MagicLinkForm({ onBack }: { onBack: () => void }) {
  const [state, formAction] = useActionState(requestLoginLink, {} as FormState);
  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-slate-600">
        We&apos;ll send a one-time sign-in link to your email and phone. You can set a new password after
        signing in.
      </p>
      <div>
        <label htmlFor="contact" className="label">Email or phone number</label>
        <input id="contact" name="contact" className="input" required placeholder="you@example.com or 17123456" />
      </div>
      <FormMessage state={state} />
      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Sending…">Send sign-in link</SubmitButton>
        <button type="button" onClick={onBack} className="text-sm text-slate-600 hover:underline">
          Back to log in
        </button>
      </div>
    </form>
  );
}
