import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Footer with a quick switch to the other portal.
export function PortalFooter({ switchTo }: { switchTo?: "donor" | "hospital" }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 text-sm text-slate-500">
        <span>Blood SOS</span>
        {switchTo && (
          <Link
            href={`/${switchTo}`}
            className="ml-auto inline-flex items-center gap-1 hover:text-slate-900"
          >
            {switchTo === "donor" ? "Donor portal" : "Hospital portal"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </footer>
  );
}
