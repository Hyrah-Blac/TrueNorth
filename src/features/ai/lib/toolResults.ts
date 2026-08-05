import type { IToolCall } from "@/types/ai";
import type { AircraftSummary, AirportSummary, CompanyInfo, ParsedToolResult } from "../types";

/**
 * Tool names as sent by the backend (see AI_TOOL_NAMES in
 * src/database/constants/ai.ts). Duplicated here as string literals
 * rather than imported because that constants file sits alongside
 * server-only Mongoose model imports elsewhere in the module graph —
 * the values themselves are a stable public contract with the API.
 */
const TOOL_NAME = {
  SEARCH_AIRCRAFT: "search_aircraft",
  LOOKUP_AIRPORT: "lookup_airport",
  FIND_NEARBY_AIRPORTS: "find_nearby_airports",
  GET_COMPANY_INFO: "get_company_info",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAircraftArray(value: unknown): value is AircraftSummary[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && "passengerCapacity" in item);
}

function isAirportArray(value: unknown): value is AirportSummary[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && "icao" in item);
}

function isCompanyInfo(value: unknown): value is CompanyInfo {
  return isRecord(value) && "phone" in value && "email" in value;
}

/**
 * Converts a message's raw `toolCalls[]` into typed, UI-ready results.
 * Tool errors (`{ error: string }`, see tools/executor.ts) are always
 * dropped. A genuinely empty search result surfaces as an "empty_*"
 * entry (guided next steps, see EmptyResultCard) rather than vanishing
 * — but only if nothing of that same kind ultimately succeeded in this
 * turn, so a successful find_nearby_airports fallback after a missed
 * lookup_airport doesn't end up showing both a "not found" card and a
 * results card for the same thing.
 */
export function parseToolResults(toolCalls: IToolCall[]): ParsedToolResult[] {
  const parsed: ParsedToolResult[] = [];
  const emptyAircraftCalls: IToolCall[] = [];
  const emptyAirportCalls: IToolCall[] = [];
  let hasSuccessfulAircraft = false;
  let hasSuccessfulAirport = false;

  for (const toolCall of toolCalls) {
    const { result } = toolCall;
    if (!result || (isRecord(result) && "error" in result)) continue;

    if (toolCall.name === TOOL_NAME.SEARCH_AIRCRAFT && isAircraftArray(result)) {
      if (result.length > 0) {
        hasSuccessfulAircraft = true;
        parsed.push({ kind: "aircraft", toolCall, aircraft: result });
      } else {
        emptyAircraftCalls.push(toolCall);
      }
      continue;
    }

    const isAirportTool =
      toolCall.name === TOOL_NAME.LOOKUP_AIRPORT || toolCall.name === TOOL_NAME.FIND_NEARBY_AIRPORTS;
    if (isAirportTool && isAirportArray(result)) {
      if (result.length > 0) {
        hasSuccessfulAirport = true;
        parsed.push({ kind: "airport", toolCall, airports: result });
      } else {
        emptyAirportCalls.push(toolCall);
      }
      continue;
    }

    if (toolCall.name === TOOL_NAME.GET_COMPANY_INFO && isCompanyInfo(result)) {
      parsed.push({ kind: "company", toolCall, company: result });
      continue;
    }
  }

  if (!hasSuccessfulAircraft && emptyAircraftCalls.length > 0) {
    parsed.push({ kind: "empty_aircraft", toolCall: emptyAircraftCalls[0] });
  }
  if (!hasSuccessfulAirport && emptyAirportCalls.length > 0) {
    parsed.push({ kind: "empty_airport", toolCall: emptyAirportCalls[0] });
  }

  return parsed;
}