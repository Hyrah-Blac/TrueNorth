import type { ReactNode } from "react";

type PageHeaderVariant = "dark" | "light";

const VARIANT_STYLES: Record<PageHeaderVariant, { eyebrow: string; title: string; description: string }> = {
  dark: { eyebrow: "text-sky-400", title: "text-white", description: "text-slate-400" },
  light: { eyebrow: "text-sky-600", title: "text-navy-900", description: "text-slate-500" },
};

/**
 * Consistent title/subtitle/actions row used at the top of every dashboard
 * section (Overview, Bookings, Quotes, Payments, Profile) so hierarchy —
 * page title vs. section headings vs. card labels — reads the same
 * everywhere in the portal. `variant="dark"` is for pages on the navy
 * customer-dashboard background; `variant="light"` is for the admin
 * section, which sits on the site's white content area.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  variant = "dark",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  variant?: PageHeaderVariant;
}) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className="flex flex-col gap-4 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
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
  );
}