import type { ReactNode } from "react";

/**
 * Consistent "N results" + trailing action/search slot used above every
 * admin list/table. Keeps result counts and spacing uniform across
 * aircraft, airports, knowledge base, bookings, quotes, payments, customers.
 */
export function ListToolbar({
  count,
  noun,
  pluralNoun,
  children,
}: {
  count: number;
  noun: string;
  /** Override the default noun + "s" pluralization. */
  pluralNoun?: string;
  children?: ReactNode;
}) {
  const label = count === 1 ? noun : (pluralNoun ?? `${noun}s`);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="spec-readout text-sm text-slate-500">
        {count} {label}
      </p>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}
