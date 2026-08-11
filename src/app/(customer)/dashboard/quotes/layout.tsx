import type { CSSProperties } from "react";
import { quoteSerif } from "./fonts";

/**
 * Scopes the Fraunces serif to the Quotes section only.
 *
 * Every `font-editorial` class in this subtree (PageHeader's title,
 * QuoteRow's route text, the quote detail headings) resolves through the
 * CSS variable --font-editorial. Rather than touching the root layout —
 * which would change that variable, and therefore every other page that
 * uses font-editorial, sitewide — this layout loads Fraunces under its
 * own variable name and locally re-points --font-editorial to it only
 * for children of this layout. Every page outside /dashboard/quotes
 * keeps reading the --font-editorial value set on <html> in the root
 * layout (Poppins), unaffected.
 */
export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={quoteSerif.variable}
      style={{ "--font-editorial": "var(--font-quote-serif)" } as CSSProperties}
    >
      {children}
    </div>
  );
}