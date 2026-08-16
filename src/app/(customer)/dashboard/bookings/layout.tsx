import type { CSSProperties } from "react";

/**
 * Scopes the Fraunces serif to the Bookings section only.
 *
 * Every `font-editorial` class in this subtree (PageHeader's title,
 * BookingCard's route text, the booking detail headings) resolves through
 * the CSS variable --font-editorial. Rather than touching the root layout —
 * which would change that variable, and therefore every other page that
 * uses font-editorial, sitewide — this layout locally re-points
 * --font-editorial to --font-dashboard-serif (the shared, self-hosted
 * Fraunces variable defined in globals.css — see layout.tsx at the app
 * root) only for children of this layout. Every page outside
 * /dashboard/bookings keeps reading the --font-editorial value set on
 * <html> (Poppins), unaffected.
 *
 * Phase 5 fix: this previously re-pointed to `var(--font-booking-serif)`,
 * a variable name nothing ever actually set (the sibling fonts.ts module
 * loaded a font under the *different* name --font-dashboard-serif) — so
 * the Fraunces override silently never took effect and this section
 * quietly fell back to Poppins the whole time. Same bug existed in the
 * Payments and Quotes sections; all three now consistently reference the
 * one real, correctly-named variable.
 */
export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ "--font-editorial": "var(--font-dashboard-serif)" } as CSSProperties}>
      {children}
    </div>
  );
}
