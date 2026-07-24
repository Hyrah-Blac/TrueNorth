import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Optional short context line under the value, e.g. "0 open invoices". */
  hint?: string;
}) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-500 ease-editorial hover:-translate-y-0.5 hover:shadow-lifted">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest2 text-slate-500">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-600 transition-colors group-hover:bg-sky-500 group-hover:text-navy-950">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="spec-readout mt-4 text-3xl font-semibold text-navy-900">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
