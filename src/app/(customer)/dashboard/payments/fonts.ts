import { Fraunces } from "next/font/google";

/**
 * Scoped to the customer Payments pages only. Exposes its own CSS variable
 * (--font-payment-serif) rather than overwriting the site-wide --font-editorial
 * variable, so every other page keeps using its existing font untouched.
 *
 * Usage: put `paymentSerif.variable` on the outermost element of a payments
 * page/layout so the variable cascades to everything inside it, then
 * reference it with the arbitrary property `[font-family:var(--font-payment-serif)]`
 * on individual headings instead of the shared `font-editorial` class.
 */
export const paymentSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-payment-serif",
  weight: ["300", "400", "500", "600"],
});