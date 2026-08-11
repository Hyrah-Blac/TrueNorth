import { Fraunces } from "next/font/google";

/**
 * Scoped to the customer Quotes pages only. Exposes its own CSS variable
 * (--font-quote-serif) rather than overwriting the site-wide --font-editorial
 * variable, so every other page keeps using its existing font untouched.
 *
 * Usage: put `quoteSerif.variable` on the outermost element of a quotes
 * page/layout so the variable cascades to everything inside it, then
 * reference it with the arbitrary property `[font-family:var(--font-quote-serif)]`
 * on individual headings instead of the shared `font-editorial` class.
 */
export const quoteSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-quote-serif",
  weight: ["300", "400", "500", "600"],
});