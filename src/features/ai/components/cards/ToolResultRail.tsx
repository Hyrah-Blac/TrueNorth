import { useMemo } from "react";
import type { IToolCall } from "@/types/ai";
import { parseToolResults } from "../../lib/toolResults";
import { AircraftResultCard } from "./AircraftResultCard";
import { AirportResultCard } from "./AirportResultCard";
import { CompanyInfoCard } from "./CompanyInfoCard";
import { EmptyResultCard } from "./EmptyResultCard";

interface ToolResultRailProps {
  toolCalls: IToolCall[];
  /**
   * Aircraft/airport `_id`s already rendered earlier in this
   * conversation (see MessageList's seenIdsPerMessage). A tool call can
   * legitimately re-run with different arguments (e.g. once mission type
   * becomes known, refining an earlier aircraft search) and still return
   * the same top result — call-level dedup in chat.service.ts can't
   * catch that, since the call genuinely isn't identical. This filters
   * by result identity instead, so a card the customer already saw
   * never renders a second time regardless of why the call re-ran.
   * Optional so ToolResultRail still works standalone/untested without
   * a caller that tracks conversation-wide identity.
   */
  seenAircraftIds?: Set<string>;
  seenAirportIds?: Set<string>;
}

export function ToolResultRail({ toolCalls, seenAircraftIds, seenAirportIds }: ToolResultRailProps) {
  const results = useMemo(() => parseToolResults(toolCalls), [toolCalls]);

  const filteredResults = useMemo(() => {
    return results
      .map((result) => {
        if (result.kind === "aircraft" && result.aircraft) {
          if (!seenAircraftIds) return result;
          const aircraft = result.aircraft.filter((a) => !seenAircraftIds.has(a._id));
          return aircraft.length > 0 ? { ...result, aircraft } : null;
        }
        if (result.kind === "airport" && result.airports) {
          if (!seenAirportIds) return result;
          const airports = result.airports.filter((a) => !seenAirportIds.has(a._id));
          return airports.length > 0 ? { ...result, airports } : null;
        }
        return result;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [results, seenAircraftIds, seenAirportIds]);

  if (filteredResults.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-4">
      {filteredResults.map((result, index) => {
        if (result.kind === "aircraft" && result.aircraft) {
          return (
            <div key={index} className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {result.aircraft.map((aircraft) => (
                <AircraftResultCard key={aircraft._id} aircraft={aircraft} />
              ))}
            </div>
          );
        }

        if (result.kind === "airport" && result.airports) {
          return (
            <div key={index} className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {result.airports.map((airport) => (
                <AirportResultCard key={airport._id} airport={airport} />
              ))}
            </div>
          );
        }

        if (result.kind === "company" && result.company) {
          return <CompanyInfoCard key={index} company={result.company} />;
        }

        if (result.kind === "empty_aircraft") {
          return <EmptyResultCard key={index} subject="aircraft" />;
        }

        if (result.kind === "empty_airport") {
          return <EmptyResultCard key={index} subject="airport" />;
        }

        return null;
      })}
    </div>
  );
}