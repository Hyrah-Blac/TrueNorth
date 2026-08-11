import type { CSSProperties } from "react";
import { bookingSerif } from "./fonts";

/**
 * Scopes the Fraunces serif to the Bookings section only.
 *
 * Every `font-editorial` class in this subtree (PageHeader's title,
 * BookingCard's route text, the booking detail headings) resolves through
 * the CSS variable --font-editorial. Rather than touching the root layout —
 * which would change that variable, and therefore every other page that
 * uses font-editorial, sitewide — this layout loads Fraunces under its
 * own variable name and locally re-points --font-editorial to it only
 * for children of this layout. Every page outside /dashboard/bookings
 * keeps reading the --font-editorial value set on <html> in the root
 * layout (Poppins), unaffected.
 */
export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={bookingSerif.variable}
      style={{ "--font-editorial": "var(--font-booking-serif)" } as CSSProperties}
    >
      {children}
    </div>
  );
}