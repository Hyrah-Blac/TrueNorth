import Link from "next/link";

export interface FilterTabOption {
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

/**
 * Segmented status-filter control used at the top of admin list pages.
 * Purely presentational — each page still owns its own status values and
 * href construction, this just renders them consistently.
 */
export function FilterTabs({ options }: { options: FilterTabOption[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          role="tab"
          aria-selected={option.active}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all duration-300 ${
            option.active
              ? "bg-navy-900 text-white shadow-soft"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {option.label}
          {typeof option.count === "number" ? (
            <span
              className={`spec-readout rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                option.active ? "bg-white/15 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {option.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}