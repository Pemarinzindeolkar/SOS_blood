import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Register as a blood donor</h1>
      <p className="mt-1 text-slate-600">
        We&apos;ll only contact you when someone near you needs your blood type.
      </p>
      <div className="card mt-6">
        <RegisterForm />
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/donor/login" className="font-medium text-red-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
