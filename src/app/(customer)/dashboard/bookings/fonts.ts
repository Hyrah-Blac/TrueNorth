import { Fraunces } from "next/font/google";

/**
 * Scoped to the customer Bookings pages only. Exposes its own CSS variable
 * (--font-booking-serif) rather than overwriting the site-wide --font-editorial
 * variable, so every other page keeps using its existing font untouched.
 *
 * Usage: put `bookingSerif.variable` on the outermost element of a bookings
 * page/layout so the variable cascades to everything inside it, then
 * reference it with the arbitrary property `[font-family:var(--font-booking-serif)]`
 * on individual headings instead of the shared `font-editorial` class.
 */
export const bookingSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-booking-serif",
  weight: ["300", "400", "500", "600"],
});
