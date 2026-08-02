import { useMemo } from "react";
import type { IToolCall } from "@/types/ai";
import { parseToolResults } from "../../lib/toolResults";
import { AircraftResultCard } from "./AircraftResultCard";
import { AirportResultCard } from "./AirportResultCard";
import { CompanyInfoCard } from "./CompanyInfoCard";

export function ToolResultRail({ toolCalls }: { toolCalls: IToolCall[] }) {
  const results = useMemo(() => parseToolResults(toolCalls), [toolCalls]);
  if (results.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-4">
      {results.map((result, index) => {
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

        return null;
      })}
    </div>
  );
}
