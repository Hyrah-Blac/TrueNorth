import { Check } from "lucide-react";
import Link from "next/link";
import { useConcierge } from "../context/ConciergeContext";
import { buildRequestQuoteHref } from "../lib/tripDraft";

const CHECKLIST_ITEMS = [
  { key: "departureAirportCode", label: "Departure" },
  { key: "destinationAirportCode", label: "Destination" },
  { key: "passengerCount", label: "Passengers" },
] as const;

/**
 * Shown once the concierge knows at least one trip detail — gives the
 * visitor a lightweight sense of progress without duplicating the actual
 * quote form. Departure + destination + passengers are treated as
 * "ready" (the three fields that make a quote link meaningful); a
 * departure date isn't tracked here since Phase 4/5 deliberately avoid
 * guessing dates from free text — the form itself asks for it next.
 */
export function QuoteProgress() {
  const { tripDraft } = useConcierge();

  const knownCount = CHECKLIST_ITEMS.filter((item) => Boolean(tripDraft[item.key])).length;
  if (knownCount === 0) return null;

  const isReady = knownCount === CHECKLIST_ITEMS.length;

  return (
    <div className="animate-[fade-up_400ms_cubic-bezier(0.16,1,0.3,1)_both] border-t border-slate-100 bg-slate-50/60 px-6 py-3 motion-reduce:animate-none sm:px-10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {CHECKLIST_ITEMS.map((item) => {
          const known = Boolean(tripDraft[item.key]);
          return (
            <span
              key={item.key}
              className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest2 transition-colors duration-300 ease-editorial ${
                known ? "text-sky-700" : "text-slate-400"
              }`}
            >
              {/* Kept circular — same reasoning as the online-status dot
                  in ConciergeHeader: a small checklist/status marker
                  reads as a universal convention, not as UI chrome that
                  needs to match the panel's rectangle language. */}
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all duration-300 ease-editorial ${
                  known ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300"
                }`}
              >
                {known ? <Check className="h-2.5 w-2.5" aria-hidden="true" /> : null}
              </span>
              {item.label}
            </span>
          );
        })}

        {isReady ? (
          <Link
            href={buildRequestQuoteHref(tripDraft)}
            className="ml-auto animate-[fade-up_400ms_cubic-bezier(0.16,1,0.3,1)_both] rounded-xl border border-blue-500 bg-blue-500 px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest2 text-white shadow-crisp transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:border-blue-700 hover:bg-blue-700 motion-reduce:animate-none"
          >
            Ready to Request Charter
          </Link>
        ) : null}
      </div>
    </div>
  );
}