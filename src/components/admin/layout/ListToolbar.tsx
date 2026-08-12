import type { ReactNode } from "react";

export function ListToolbar({
  count,
  noun,
  pluralNoun,
  children,
}: {
  count: number;
  noun: string;
  pluralNoun?: string;
  children?: ReactNode;
}) {
  const label = count === 1 ? noun : (pluralNoun ?? `${noun}s`);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-4 py-2.5">
      <p className="spec-readout text-xs text-slate-400">
        <span className="font-semibold text-navy-900">{count}</span>{" "}
        {label}
      </p>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}