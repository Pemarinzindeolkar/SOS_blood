import { Suspense } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { getDonor } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { PortalFooter } from "@/components/PortalFooter";
import { logoutDonor } from "./actions";

export default function DonorLayout({ children }: LayoutProps<"/donor">) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <Logo href="/donor" />
          <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            Donor Portal
          </span>
          <div className="ml-auto">
            <Suspense fallback={null}>
              <DonorAccount />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <PortalFooter switchTo="hospital" />
    </>
  );
}

async function DonorAccount() {
  const donor = await getDonor();
  if (!donor) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link href="/donor/login" className="btn-secondary">Log in</Link>
        <Link href="/donor/register" className="btn-primary">Register</Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-slate-600 sm:inline">{donor.name}</span>
      <form action={logoutDonor}>
        <button className="btn-secondary" aria-label="Log out">
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
        </button>
      </form>
    </div>
  );
}
