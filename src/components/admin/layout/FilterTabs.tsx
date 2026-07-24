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
            option.active ? "bg-sky-500 text-navy-950" : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]"
          }`}
        >
          {option.label}
          {typeof option.count === "number" ? (
            <span
              className={`spec-readout rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                option.active ? "bg-navy-950/15 text-navy-950" : "bg-white/10 text-slate-300"
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
