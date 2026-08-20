/**
 * RouteDisplay
 *
 * Premium charter route display — Option B treatment:
 *   Bambili-Dingila [FZKB] → Bandundu [FDU]
 *
 * The airport name is set in the project's editorial serif face.
 * The ICAO/IATA code sits inline as a boxed pill tag — like an
 * aviation luggage label — rendered in a tight monospaced face.
 * The → arrow uses the italic variant of the serif for calligraphic
 * elegance over a plain sans character.
 *
 * Usage
 * -----
 *   // Minimal — just codes
 *   <RouteDisplay
 *     departure={{ code: "FZKB" }}
 *     destination={{ code: "FDU" }}
 *   />
 *
 *   // With names resolved from your airportNames map
 *   <RouteDisplay
 *     departure={{ code: "FZKB", name: airportNames["FZKB"] }}
 *     destination={{ code: "FDU",  name: airportNames["FDU"] }}
 *   />
 *
 *   // Size variants
 *   <RouteDisplay size="sm" departure={…} destination={…} />   // sidebar / list rows
 *   <RouteDisplay size="md" departure={…} destination={…} />   // detail page hero (default)
 *   <RouteDisplay size="lg" departure={…} destination={…} />   // page-level heading
 */

import type { ReactNode } from "react";

export interface RoutePoint {
  /** ICAO or IATA airport code, e.g. "FZKB" or "FDU" */
  code: string;
  /**
   * Full airport / city name, e.g. "Bambili-Dingila".
   * Accepts a plain string, or the object shape that getAirportNamesByCodes
   * may return ({ name, city, ... }) — the component extracts the string
   * automatically. Pass null / undefined to render just the code.
   */
  name?: string | Record<string, unknown> | null;
}

/**
 * Safely coerce whatever getAirportNamesByCodes hands back into a
 * display string. The API currently returns { name, city } objects
 * but callers may also pass a plain string or nothing at all.
 */
function resolveAirportName(
  name: RoutePoint["name"]
): string | null {
  if (!name) return null;
  if (typeof name === "string") return name || null;
  // Object shape — prefer .name, fall back to .city, then give up
  const n = (name as Record<string, unknown>).name;
  const c = (name as Record<string, unknown>).city;
  if (typeof n === "string" && n) return n;
  if (typeof c === "string" && c) return c;
  return null;
}

export type RouteDisplaySize = "sm" | "md" | "lg";

export interface RouteDisplayProps {
  departure: RoutePoint;
  destination: RoutePoint;
  /** Visual scale. Defaults to "md". */
  size?: RouteDisplaySize;
  /** Optional eyebrow label above the route (e.g. "Charter Proposal", "Booking #BK-00042"). */
  eyebrow?: ReactNode;
  /** Extra Tailwind classes on the root wrapper. */
  className?: string;
}

// Per-size typographic tokens
const sizeTokens = {
  sm: {
    eyebrow: "text-[10px] tracking-widest uppercase text-slate-400 mb-0.5",
    name: "font-editorial text-sm font-light text-navy-900 leading-none",
    // Pill badge: border + rounded + monospaced
    codeWrapper: "inline-flex items-center border border-slate-200 rounded-[3px] px-1 py-px ml-1.5",
    code: "spec-readout text-[9px] font-medium text-slate-400 uppercase tracking-[0.18em] leading-none",
    // Italic serif arrow — rendered as a styled span so the font-style applies
    arrow: "font-editorial italic text-slate-300 text-sm mx-2 select-none not-italic",
    arrowChar: "→",
  },
  md: {
    eyebrow: "text-xs tracking-widest uppercase text-slate-400 mb-1",
    name: "font-editorial text-2xl font-light text-navy-900 leading-none",
    codeWrapper: "inline-flex items-center border border-slate-200 rounded-[3px] px-1.5 py-0.5 ml-2",
    code: "spec-readout text-[10px] font-medium text-slate-400 uppercase tracking-[0.18em] leading-none",
    arrow: "font-editorial italic text-slate-300 text-xl mx-3 select-none",
    arrowChar: "→",
  },
  lg: {
    eyebrow: "text-xs tracking-widest uppercase text-slate-400 mb-1.5",
    name: "font-editorial text-4xl font-light text-navy-900 leading-none",
    codeWrapper: "inline-flex items-center border border-slate-200 rounded-[3px] px-2 py-0.5 ml-2.5",
    code: "spec-readout text-xs font-medium text-slate-400 uppercase tracking-[0.18em] leading-none",
    arrow: "font-editorial italic text-slate-300 text-3xl mx-4 select-none",
    arrowChar: "→",
  },
} as const;

function AirportLabel({
  point,
  size,
}: {
  point: RoutePoint;
  size: RouteDisplaySize;
}) {
  const t = sizeTokens[size];
  const displayName = resolveAirportName(point.name);

  if (!displayName) {
    // No resolvable name — render code alone in the name style (graceful fallback)
    return <span className={t.name}>{point.code}</span>;
  }

  return (
    <span className="inline-flex items-baseline">
      <span className={t.name}>{displayName}</span>
      {/* Boxed pill tag — sits at baseline, nudged up slightly via relative positioning */}
      <span className={t.codeWrapper} style={{ position: "relative", top: "-1px" }}>
        <span className={t.code}>{point.code}</span>
      </span>
    </span>
  );
}

export function RouteDisplay({
  departure,
  destination,
  size = "md",
  eyebrow,
  className = "",
}: RouteDisplayProps) {
  const t = sizeTokens[size];

  return (
    <div className={className}>
      {eyebrow ? <p className={t.eyebrow}>{eyebrow}</p> : null}
      <div className="flex flex-wrap items-baseline gap-y-1">
        <AirportLabel point={departure} size={size} />
        {/* Italic serif arrow — the font-editorial class applies the serif;
            italic gives the calligraphic quality that distinguishes this from
            a plain sans → character */}
        <span className={t.arrow} aria-label="to">
          {t.arrowChar}
        </span>
        <AirportLabel point={destination} size={size} />
      </div>
    </div>
  );
}
