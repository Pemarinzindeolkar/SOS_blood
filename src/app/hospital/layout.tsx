import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { getHospital } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { PortalFooter } from "@/components/PortalFooter";
import { logoutHospital } from "./actions";

export default function HospitalLayout({ children }: LayoutProps<"/hospital">) {
  return (
    <>
      <header className="bg-slate-900">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <Logo href="/hospital" light />
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-200">
            Hospital Portal
          </span>
          <div className="ml-auto">
            <Suspense fallback={null}>
              <HospitalAccount />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <PortalFooter switchTo="donor" />
    </>
  );
}

async function HospitalAccount() {
  const hospital = await getHospital();
  if (!hospital) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden max-w-xs truncate text-slate-300 sm:inline">{hospital.name}</span>
      <form action={logoutHospital}>
        <button
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-slate-100 hover:bg-white/10"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
        </button>
      </form>
    </div>
  );
}
