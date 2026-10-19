import { ShieldCheck } from "lucide-react";
import { HospitalLoginForm } from "./HospitalLoginForm";

export default function HospitalLoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Hospital staff log in</h1>
      <p className="mt-1 flex items-start gap-2 text-slate-600">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        Only verified hospitals and blood banks can send SOS alerts. Accounts are created by the administrator.
      </p>
      <div className="card mt-6">
        <HospitalLoginForm />
      </div>
    </div>
  );
}
