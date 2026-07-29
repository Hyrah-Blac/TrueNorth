import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface DetailHeaderProps {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  status?: ReactNode;
  actions?: ReactNode;
}

/**
 * Shared header for every admin detail page (booking, quote, payment,
 * customer) — back link, eyebrow + big editorial title, and a status
 * badge / actions slot on the right. Keeps the identifying info (record
 * number, route, name) anchored at the top instead of buried in the
 * first card.
 */
export function DetailHeader({ backHref, backLabel, eyebrow, title, subtitle, status, actions }: DetailHeaderProps) {
  return (
    <div className="mb-7">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 transition-colors hover:text-sky-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to {backLabel}
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="spec-readout text-xs uppercase tracking-widest2 text-sky-600">{eyebrow}</p>
          <h1 className="mt-1.5 font-editorial text-3xl font-light italic tracking-tight text-navy-900 sm:text-4xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {status || actions ? (
          <div className="flex shrink-0 items-center gap-3">
            {status}
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}