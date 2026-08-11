import Link from "next/link";

export interface FilterTabOption {
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

export function FilterTabs({ options }: { options: FilterTabOption[] }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          role="tab"
          aria-selected={option.active}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 ${
            option.active
              ? "text-white shadow-soft"
              : "bg-white border border-slate-200 text-slate-500 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          }`}
          style={
            option.active
              ? {
                  background: "linear-gradient(135deg, rgb(30 58 128) 0%, rgb(43 91 191) 100%)",
                  boxShadow: "0 2px 8px rgb(43 91 191 / 0.25), inset 0 1px 0 rgb(255 255 255 / 0.1)",
                }
              : undefined
          }
        >
          {option.label}
          {typeof option.count === "number" ? (
            <span
              className={`spec-readout rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                option.active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
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