import type { CSSProperties } from "react";
import { paymentSerif } from "./fonts";

/**
 * Scopes the Fraunces serif to the Payments section only.
 *
 * Every `font-editorial` class in this subtree (PageHeader's title,
 * PaymentRow's method text, the receipt heading) resolves through the
 * CSS variable --font-editorial. Rather than touching the root layout —
 * which would change that variable, and therefore every other page that
 * uses font-editorial, sitewide — this layout loads Fraunces under its
 * own variable name and locally re-points --font-editorial to it only
 * for children of this layout. Every page outside /dashboard/payments
 * keeps reading the --font-editorial value set on <html> in the root
 * layout (Poppins), unaffected.
 */
export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={paymentSerif.variable}
      style={{ "--font-editorial": "var(--font-payment-serif)" } as CSSProperties}
    >
      {children}
    </div>
  );
}