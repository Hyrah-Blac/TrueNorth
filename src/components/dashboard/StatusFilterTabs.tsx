import Link from "next/link";

export interface StatusFilterOption {
  label: string;
  href: string;
  active: boolean;
}

export function StatusFilterTabs({ options }: { options: StatusFilterOption[] }) {
  return (
    <div
      role="tablist"
      aria-label="Filter by status"
      className="inline-flex flex-wrap gap-1 rounded-md border border-slate-200 bg-slate-50 p-1"
    >
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          role="tab"
          aria-selected={option.active}
          className={`rounded-[calc(theme(borderRadius.md)-2px)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide transition-all duration-300 ${
            option.active ? "bg-navy-900 text-white shadow-soft" : "text-slate-500 hover:bg-white hover:text-navy-900"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}