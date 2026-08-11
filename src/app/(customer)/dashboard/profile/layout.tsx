import type { CSSProperties } from "react";
import { editorialSerif } from "@/lib/fonts/editorial-serif";

/**
 * Same pattern as quotes/layout.tsx: scopes the Fraunces serif to the
 * Profile page only by locally re-pointing --font-editorial for this
 * subtree, without touching the root layout or any other page's fonts.
 */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={editorialSerif.variable}
      style={{ "--font-editorial": "var(--font-quote-serif)" } as CSSProperties}
    >
      {children}
    </div>
  );
}