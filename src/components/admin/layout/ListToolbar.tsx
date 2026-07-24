import type { ReactNode } from "react";

/**
 * Consistent "N results" + trailing action/search slot used above every
 * admin list/table. Keeps result counts and spacing uniform across
 * aircraft, bookings, quotes, payments, customers and messages.
 */
export function ListToolbar({
  count,
  noun,
  children,
}: {
  count: number;
  noun: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="spec-readout text-sm text-slate-500">
        {count} {count === 1 ? noun : `${noun}s`}
      </p>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}
