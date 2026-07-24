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
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-inset ring-sky-500/15">
        {icon ?? <SearchX className="h-5 w-5" aria-hidden="true" />}
      </span>
      <h3 className="mt-5 font-display text-lg font-semibold text-navy-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{description}</p>
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}
