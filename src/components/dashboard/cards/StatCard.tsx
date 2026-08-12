import type { LucideIcon } from "lucide-react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

type AnyIcon = LucideIcon | PhosphorIcon;

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: AnyIcon;
  /** Optional short context line under the value, e.g. "0 open invoices". */
  hint?: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-white p-4 transition-colors duration-200 hover:bg-sky-50/40"
      style={{ border: "1px solid rgb(228 229 232)", boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.8)" }}
    >
      {/* Top-left accent stripe */}
      <div
        className="absolute left-0 top-0 h-full w-0.5 rounded-l-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(180deg, rgb(43 91 191) 0%, transparent 100%)" }}
        aria-hidden="true"
      />

      {/* Label row */}
      <div className="flex items-start justify-between gap-3">
        <p
          className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400"
          style={{ fontFamily: "var(--font-data, ui-monospace, monospace)" }}
        >
          {label}
        </p>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{
            background: "rgb(237 242 251)",
            color: "rgb(43 91 191)",
          }}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
        </span>
      </div>

      {/* Value — editorial display, compact and precise */}
      <p
        className="mt-4 text-2xl font-light leading-none tracking-tight text-navy-900"
        style={{ fontFamily: "var(--font-editorial, system-ui, sans-serif)" }}
      >
        {value}
      </p>

      {hint ? (
        <p
          className="mt-1.5 text-[9px] uppercase tracking-[0.14em] text-slate-400"
          style={{ fontFamily: "var(--font-data, ui-monospace, monospace)" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}