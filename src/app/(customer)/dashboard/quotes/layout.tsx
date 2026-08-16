import type { CSSProperties } from "react";

/**
 * Scopes the Fraunces serif to the Quotes section only.
 *
 * Every `font-editorial` class in this subtree (PageHeader's title,
 * QuoteRow's route text, the quote detail headings) resolves through the
 * CSS variable --font-editorial. Rather than touching the root layout —
 * which would change that variable, and therefore every other page that
 * uses font-editorial, sitewide — this layout locally re-points
 * --font-editorial to --font-dashboard-serif (the shared, self-hosted
 * Fraunces variable defined in globals.css — see layout.tsx at the app
 * root) only for children of this layout. Every page outside
 * /dashboard/quotes keeps reading the --font-editorial value set on
 * <html> (Poppins), unaffected.
 *
 * Phase 5 fix: this previously re-pointed to `var(--font-quote-serif)`,
 * which happened to be a real variable name (used correctly by the
 * Profile section) but was never actually set anywhere in *this*
 * subtree — the sibling fonts.ts module here loaded a font under the
 * different name --font-dashboard-serif. So the Fraunces override
 * silently never took effect and this section quietly fell back to
 * Poppins the whole time. Same bug existed in the Bookings and Payments
 * sections; all three now consistently reference the one real,
 * correctly-named variable.
 */
export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ "--font-editorial": "var(--font-dashboard-serif)" } as CSSProperties}>
      {children}
    </div>
  );
}
