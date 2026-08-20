import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

type DetailHeaderVariant = "dark" | "light";

type DetailHeaderStyles = { back: string; backHover: string; eyebrow: string; title: string; subtitle: string };

const VARIANT_STYLES: Record<DetailHeaderVariant, DetailHeaderStyles> = {
  dark: {
    back: "text-slate-400",
    backHover: "hover:text-sky-400",
    eyebrow: "text-sky-400",
    title: "text-white",
    subtitle: "text-slate-400",
  },
  light: {
    back: "text-slate-400",
    backHover: "hover:text-sky-600",
    eyebrow: "text-sky-600",
    title: "text-navy-900",
    subtitle: "text-slate-500",
  },
};

interface DetailHeaderProps {
  backHref: string;
  backLabel: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  status?: ReactNode;
  actions?: ReactNode;
  variant?: DetailHeaderVariant;
}

export function DetailHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  status,
  actions,
  variant = "dark",
}: DetailHeaderProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className="mb-8">
      {/* Back link — styled as a quiet navigation pill */}
      <Link
        href={backHref}
        className={`group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium uppercase tracking-wide transition-all duration-200 hover:border-sky-200 hover:bg-sky-50 ${styles.back} ${styles.backHover}`}
      >
        <ChevronLeft
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        {backLabel}
      </Link>

      {/* Title row */}
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className={`spec-readout text-xs uppercase tracking-widest2 ${styles.eyebrow}`}>{eyebrow}</p>
          ) : null}
          <h1
            className={`font-editorial text-3xl font-light tracking-tight sm:text-4xl ${styles.title} ${
              eyebrow ? "mt-1.5" : ""
            }`}
          >
            {title}
          </h1>
          {subtitle ? <p className={`mt-1.5 text-sm ${styles.subtitle}`}>{subtitle}</p> : null}
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