"use client";

import type { LucideIcon } from "lucide-react";
import { Plane, PlaneTakeoff, PlaneLanding, X } from "lucide-react";
import { useConcierge } from "../context/ConciergeContext";

interface LegProps {
  Icon: LucideIcon;
  label: string;
  name?: string;
  code?: string;
  onClear: () => void;
  align: "left" | "right";
}

/**
 * A single departure/destination leg. `align="right"` mirrors the whole
 * row (icon, name, code, clear button) so the two legs read like a
 * boarding pass — symmetric around the flight-path connector — rather
 * than two identically left-aligned blocks.
 */
function Leg({ Icon, label, name, code, onClear, align }: LegProps) {
  const isSet = Boolean(name);
  const reversed = align === "right";

  return (
    <div className={`group flex min-w-0 flex-1 items-center gap-2 ${reversed ? "flex-row-reverse text-right" : ""}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
          isSet ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="font-display text-[8.5px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        {isSet ? (
          <div className={`flex items-baseline gap-1.5 ${reversed ? "flex-row-reverse" : ""}`}>
            <p className="truncate font-editorial text-[12.5px] leading-tight text-navy-900" title={name}>
              {name}
            </p>
            {code ? (
              <span className="inline-flex shrink-0 items-center rounded-[3px] border border-slate-200 px-1 py-px">
                <span className="spec-readout text-[8px] font-medium uppercase tracking-[0.18em] leading-none text-slate-400">
                  {code}
                </span>
              </span>
            ) : null}
            <button
              type="button"
              onClick={onClear}
              aria-label={`Clear ${label.toLowerCase()}`}
              className="shrink-0 text-slate-300 opacity-0 transition-opacity duration-200 hover:text-navy-900 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X className="h-2.5 w-2.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <p className="font-editorial text-[12px] text-slate-400">Not set</p>
        )}
      </div>
    </div>
  );
}

export function TripDraftSummary() {
  const { tripDraft, clearTripDraftAirport } = useConcierge();
  const { departureAirportName, departureAirportCode, destinationAirportName, destinationAirportCode } = tripDraft;

  // Stays out of the way entirely until the concierge (or the visitor)
  // has actually picked a leg — no empty strip cluttering a fresh chat.
  if (!departureAirportName && !destinationAirportName) return null;

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
      <Leg
        Icon={PlaneTakeoff}
        label="From"
        name={departureAirportName}
        code={departureAirportCode}
        onClear={() => clearTripDraftAirport("departure")}
        align="left"
      />

      {/* Flight-path connector — a hairline gradient with a small circular
          "cutout" carrying a rotated plane glyph, echoing a boarding-pass
          stub rather than a plain divider. */}
      <div className="relative flex h-4 w-10 shrink-0 items-center sm:w-14">
        <div className="h-px w-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
        <div className="absolute left-1/2 top-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-50">
          <Plane className="h-2.5 w-2.5 rotate-90 text-slate-400" aria-hidden="true" />
        </div>
      </div>

      <Leg
        Icon={PlaneLanding}
        label="To"
        name={destinationAirportName}
        code={destinationAirportCode}
        onClear={() => clearTripDraftAirport("destination")}
        align="right"
      />
    </div>
  );
}