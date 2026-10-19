import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function DonorLoginPage({ searchParams }: PageProps<"/donor/login">) {
  const { expired } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Donor log in</h1>
      <p className="mt-1 text-slate-600">Log in with your email or phone number and password.</p>
      {expired && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          That sign-in link has expired or was already used. Please request a new one.
        </p>
      )}
      <div className="card mt-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/donor/register" className="font-medium text-red-700 hover:underline">
          Register as a donor
        </Link>
      </p>
    </div>
  );
}
