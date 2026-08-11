import { Fraunces } from "next/font/google";

/**
 * Shared serif font for the customer dashboard's Payments, Quotes, and
 * Bookings sections. Previously each section declared its own identical
 * `Fraunces({...})` call under a different CSS variable name, which meant
 * three separate fetches to Google Fonts at build time — tripling the
 * chance of a build failing if fonts.gstatic.com is briefly unreachable
 * (as happened in production). Consolidated to a single fetch here.
 *
 * All three sections use the same CSS variable, `--font-dashboard-serif`.
 * This is safe because a person is only ever in one of these sections'
 * subtree at a time, and even if nested, the same variable name cascading
 * from multiple ancestors resolves to the same value either way.
 *
 * Usage: put `dashboardSerif.variable` on the outermost element of a
 * page/layout so the variable cascades to everything inside it, then
 * reference it with the arbitrary property
 * `[font-family:var(--font-dashboard-serif)]` on individual headings
 * instead of the shared `font-editorial` class.
 */
export const dashboardSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-dashboard-serif",
  weight: ["300", "400", "500", "600"],
});
