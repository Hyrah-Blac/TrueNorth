import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PageHeaderVariant = "dark" | "light";

const VARIANT_STYLES: Record<PageHeaderVariant, { eyebrow: string; title: string; description: string; border: string }> = {
  dark: { eyebrow: "text-sky-400", title: "text-white", description: "text-slate-400", border: "border-white/10" },
  light: { eyebrow: "text-sky-600", title: "text-navy-900", description: "text-slate-500", border: "border-slate-200" },
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  variant = "dark",
  backHref,
  backLabel,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  variant?: PageHeaderVariant;
  backHref?: string;
  backLabel?: string;
}) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className={`mb-8 border-b pb-7 ${styles.border}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-sky-600"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {backLabel ?? "Back"}
            </Link>
          ) : null}
          {eyebrow ? (
            <p className={`spec-readout text-xs uppercase tracking-widest2 ${styles.eyebrow}`}>{eyebrow}</p>
          ) : null}
          <h1
            className={`font-editorial text-4xl font-light tracking-tight ${styles.title} ${
              eyebrow ? "mt-1.5" : ""
            }`}
          >
            {title}
          </h1>
          {description ? (
            <p className={`mt-2 max-w-lg text-sm leading-relaxed ${styles.description}`}>{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}