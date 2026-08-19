import Link from "next/link";

export interface StatusFilterOption {
  label: string;
  href: string;
  active: boolean;
}

// Matches the fleet filter chips (FleetFilters.tsx): a soft bordered
// tray holding rounded pill tabs, active state marked by a sky-blue
// border/fill rather than a solid dark background — so filter controls
// look the same wherever they appear in the portal. Horizontally
// scrollable with a fade mask on narrow screens, same as fleet filters,
// since this row has more labels than will comfortably fit on mobile.
const SCROLL_FADE_MASK =
  "[mask-image:linear-gradient(to_right,transparent,black_6px,black_calc(100%-6px),transparent)] sm:[mask-image:none]";

export function StatusFilterTabs({ options }: { options: StatusFilterOption[] }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.02] sm:p-3.5">
      <div
        role="tablist"
        aria-label="Filter by status"
        className={`scrollbar-none flex gap-1.5 overflow-x-auto pb-px sm:flex-wrap ${SCROLL_FADE_MASK}`}
      >
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            role="tab"
            aria-selected={option.active}
            className={`inline-flex min-h-[1.75rem] shrink-0 items-center rounded-full border px-3 py-1 font-display text-[0.6875rem] font-medium uppercase tracking-wide whitespace-nowrap transition-all duration-300 ${
              option.active
                ? "border-sky-500 bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.15)]"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-navy-900"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}