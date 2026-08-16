import type { CSSProperties } from "react";

/**
 * Scopes the Fraunces serif to the Profile page only, by locally
 * re-pointing --font-editorial to --font-dashboard-serif (the shared,
 * self-hosted Fraunces variable defined in globals.css — see layout.tsx
 * at the app root) for this subtree, without touching the root layout
 * or any other page's fonts. This one was already correctly wired
 * before Phase 5 (unlike Bookings/Payments/Quotes — see those
 * layout.tsx files); now it references the same single shared variable
 * as the other three for consistency.
 */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ "--font-editorial": "var(--font-dashboard-serif)" } as CSSProperties}>
      {children}
    </div>
  );
}
