import type { CSSProperties } from "react";

/**
 * Scopes two things to the Quotes section only, without touching the root
 * layout or any other page:
 *
 * 1. The Fraunces serif. `--font-editorial` is re-pointed to
 *    `--font-dashboard-serif` for children of this layout, so the quote
 *    titles and route text use Fraunces while every page outside
 *    /dashboard/quotes keeps the sitewide font.
 *
 * 2. The accent colour. The site-wide "champagne" gold (and the muted
 *    success green) are re-pointed here to a deep emerald ramp. Because the
 *    colour utilities read these CSS variables at runtime, every
 *    `champagne-*` / `green-*` class and the `.skeleton` shimmer inside this
 *    subtree turns emerald automatically — the rest of the site stays gold.
 *    Values are space-separated RGB triplets, as in styles/variables.css.
 *    The `--bk-*` ramp is for shades (50–300, 700) the global tokens don't
 *    define; use it via `rgb(var(--bk-50) / 0.6)`.
 */
const EMERALD: Record<string, string> = {
  "--bk-50": "236 247 241", //  #ecf7f1
  "--bk-100": "214 238 225", // #d6eee1
  "--bk-200": "178 222 200", // #b2dec8
  "--bk-300": "125 200 164", // #7dc8a4
  "--bk-400": "72 184 132", //  #48b884
  "--bk-500": "16 140 98", //   #108c62 — Emerald
  "--bk-600": "10 108 76", //   #0a6c4c — AA on white
  "--bk-700": "6 78 57", //     #064e39

  // Re-point the existing tokens used by gold-styled elements.
  "--color-champagne-400": "72 184 132",
  "--color-champagne-500": "16 140 98",
  "--color-champagne-600": "10 108 76",

  // Success / "confirmed" / fully-paid share the same emerald family so the
  // page reads as one accent colour rather than gold + a second green.
  "--color-green-700": "6 78 57",
  "--color-green-600": "10 108 76",
  "--color-green-500": "16 140 98",
  "--color-green-400": "72 184 132",
  "--color-green-100": "214 238 225",
  "--color-green-50": "236 247 241",
};

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={
        {
          "--font-editorial": "var(--font-dashboard-serif)",
          ...EMERALD,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}