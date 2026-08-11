import { Fraunces } from "next/font/google";

/**
 * Shared by every dashboard segment that opts into the editorial serif
 * treatment (currently: Quotes, Profile). Exposes its own CSS variable
 * (--font-quote-serif) rather than overwriting the site-wide
 * --font-editorial variable, so pages that DON'T import a layout using
 * this font keep reading the value set on <html> in the root layout
 * (Poppins), completely unaffected.
 *
 * Import this from a route-segment layout.tsx and apply
 * `editorialSerif.variable` + the local --font-editorial re-point — see
 * quotes/layout.tsx or profile/layout.tsx for the pattern.
 */
export const editorialSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-quote-serif",
  weight: ["300", "400", "500", "600"],
});