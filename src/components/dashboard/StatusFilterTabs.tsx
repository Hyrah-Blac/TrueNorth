import Link from "next/link";

export interface StatusFilterOption {
  label: string;
  href: string;
  active: boolean;
}

/**
 * Segmented filter control shared by the Bookings and Quotes list pages.
 * Purely presentational — each page still owns its own status values,
 * labels, and URL construction, and passes the resolved options in.
 */
export function StatusFilterTabs({ options }: { options: StatusFilterOption[] }) {
  return (
    <div
      role="tablist"
      aria-label="Filter by status"
      className="flex flex-wrap gap-1.5 rounded-md border border-white/10 bg-white/[0.03] p-1.5"
    >
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          role="tab"
          aria-selected={option.active}
          className={`rounded-[calc(theme(borderRadius.md)-2px)] px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all duration-300 ${
            option.active
              ? "bg-sky-500 text-navy-950 shadow-soft"
              : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
