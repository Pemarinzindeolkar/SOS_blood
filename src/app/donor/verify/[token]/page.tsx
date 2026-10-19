import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { query } from "@/lib/db";
import { SubmitButton } from "@/components/SubmitButton";
import { confirmLogin } from "../../actions";

// The "forgot password" magic link lands here. We ask for one tap before
// signing in, because email apps often open links automatically to scan
// them, which would otherwise use up the one-time link.
export default async function VerifyPage({ params }: PageProps<"/donor/verify/[token]">) {
  const { token } = await params;
  const [row] = await query<{ name: string }>(
    `SELECT d.name FROM login_tokens t JOIN donors d ON d.id = t.donor_id
     WHERE t.token = $1 AND t.used_at IS NULL AND t.expires_at > now()`,
    [token],
  );
  if (!row) redirect("/donor/login?expired=1");

  return (
    <div className="mx-auto max-w-md">
      <div className="card text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-700">
          <KeyRound className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">Welcome back, {row.name}</h1>
        <p className="mt-1 text-slate-600">Continue to sign in. You can set a new password from your dashboard.</p>
        <form action={confirmLogin} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <SubmitButton pendingText="Signing in…" className="btn-primary w-full">Continue</SubmitButton>
        </form>
      </div>
    </div>
  );
}
