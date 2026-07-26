import type { ReactNode } from "react";

/**
 * Consistent title/subtitle/actions row used at the top of every dashboard
 * section (Overview, Bookings, Quotes, Payments, Profile) so hierarchy —
 * page title vs. section headings vs. card labels — reads the same
 * everywhere in the portal.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="spec-readout text-xs uppercase tracking-widest2 text-sky-400">{eyebrow}</p>
        ) : null}
        <h1 className={`font-editorial text-4xl font-light tracking-tight text-white ${eyebrow ? "mt-1.5" : ""}`}>
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}