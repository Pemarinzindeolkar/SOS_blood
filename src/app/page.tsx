import Link from "next/link";
import { ArrowRight, BellRing, CircleCheck, Hospital, MapPin, Siren, UserRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PortalFooter } from "@/components/PortalFooter";

const steps = [
  { icon: Siren, title: "Emergency", text: "A patient needs blood at the hospital." },
  { icon: Hospital, title: "Hospital raises SOS", text: "Staff enter the blood type and units needed." },
  { icon: MapPin, title: "Donors are matched", text: "Compatible, eligible donors nearby are found." },
  { icon: BellRing, title: "Donors are alerted", text: "By SMS and email, with a one-tap link." },
  { icon: CircleCheck, title: "Donors respond", text: "The hospital sees who is coming, live." },
];

export default function Home() {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-14 px-4 py-12">
        <section className="max-w-2xl">
          <p className="text-sm font-medium text-red-700">Emergency blood donor network</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Reach the right blood donors within minutes.
          </h1>
          <p className="mt-4 text-slate-600">
            Instead of phone calls and social media posts, Blood SOS alerts registered donors who have a
            compatible blood type and live close to the hospital, as soon as blood is needed.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <PortalCard
            icon={UserRound}
            title="Donor portal"
            text="Register as a donor, keep your availability up to date and respond to SOS alerts near you."
            primary={{ href: "/donor/register", label: "Register as donor" }}
            secondary={{ href: "/donor/login", label: "Log in" }}
          />
          <PortalCard
            icon={Hospital}
            title="Hospital portal"
            text="For verified hospital and blood bank staff to raise SOS requests and track donor responses."
            primary={{ href: "/hospital/login", label: "Hospital log in" }}
          />
        </section>

        <section>
          <h2 className="section-title mb-4">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => (
              <li key={step.title} className="card p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <step.icon className="h-[18px] w-[18px]" />
                </span>
                <p className="mt-3 text-xs font-medium text-slate-500">Step {i + 1}</p>
                <p className="font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <PortalFooter />
    </>
  );
}

function PortalCard({
  icon: Icon,
  title,
  text,
  primary,
  secondary,
}: {
  icon: typeof Hospital;
  title: string;
  text: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-slate-600">{text}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={primary.href} className="btn-primary">
          {primary.label} <ArrowRight className="h-4 w-4" />
        </Link>
        {secondary && (
          <Link href={secondary.href} className="btn-secondary">{secondary.label}</Link>
        )}
      </div>
    </div>
  );
}
