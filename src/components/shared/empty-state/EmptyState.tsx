import type { ReactNode } from "react";
import { SearchX } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/70 px-5 py-12 text-center shadow-[0_1px_3px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.02] sm:px-6 sm:py-14 lg:py-16">
      {/* Faint radial glow behind the icon — a quiet bit of depth so the
          empty state doesn't read as a bare, unfinished placeholder. */}
      <div
        className="pointer-events-none absolute left-1/2 top-8 h-32 w-32 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.08),transparent_70%)] sm:top-10 sm:h-40 sm:w-40"
        aria-hidden="true"
      />

      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white to-slate-100 text-sky-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-inset ring-sky-500/20 sm:h-12 sm:w-12">
        {icon ?? <SearchX className="h-4 w-4" aria-hidden="true" />}
      </span>
      <h3 className="relative mt-4 font-display text-[0.8125rem] font-semibold tracking-tight text-navy-900 sm:mt-5 sm:text-sm">
        {title}
      </h3>
      <p className="relative mt-2 max-w-[15rem] text-[0.6875rem] leading-relaxed text-slate-500 sm:max-w-xs sm:text-xs">
        {description}
      </p>
      {action ? <div className="relative mt-5 sm:mt-6">{action}</div> : null}
    </div>
  );
}