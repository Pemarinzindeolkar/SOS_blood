const styles: Record<string, string> = {
  open: "bg-red-50 text-red-700 ring-1 ring-red-200",
  fulfilled: "bg-green-50 text-green-700 ring-1 ring-green-200",
  cancelled: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  accepted: "bg-green-50 text-green-700 ring-1 ring-green-200",
  declined: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  donated: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${styles[status] ?? ""}`}>{status}</span>;
}
