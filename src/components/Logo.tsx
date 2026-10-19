import Link from "next/link";
import { Droplet } from "lucide-react";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-700 text-white">
        <Droplet className="h-4 w-4" fill="currentColor" strokeWidth={0} />
      </span>
      <span className={`text-base font-semibold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
        Blood SOS
      </span>
    </Link>
  );
}
