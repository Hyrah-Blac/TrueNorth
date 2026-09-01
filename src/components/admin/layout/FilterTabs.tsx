import Link from "next/link";

export interface FilterTabOption {
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

// Matches the customer-side StatusFilterTabs (dashboard/quotes): a soft
// bordered tray holding rounded pill tabs, active state marked by a
// sky-blue border/fill rather than a solid dark gradient — so filter
// controls look the same on both sides of the app. Horizontally
// scrollable with a fade mask on narrow screens for rows with many labels.
const SCROLL_FADE_MASK =
  "[mask-image:linear-gradient(to_right,transparent,black_6px,black_calc(100%-6px),transparent)] sm:[mask-image:none]";

export function FilterTabs({ options }: { options: FilterTabOption[] }) {
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
            className={`inline-flex min-h-[1.75rem] shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-wide whitespace-nowrap transition-all duration-300 ${
              option.active
                ? "border-[#2d5a3d] bg-[#2d5a3d]/[0.08] text-[#2d5a3d] shadow-[inset_0_0_0_1px_rgba(45,90,61,0.15)]"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-navy-900"
            }`}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={`spec-readout rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  option.active ? "bg-[#2d5a3d]/[0.12] text-[#2d5a3d]" : "bg-slate-100 text-slate-400"
                }`}
              >
                {option.count}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}