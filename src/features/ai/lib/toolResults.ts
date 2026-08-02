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
 * Tool errors (`{ error: string }`, see tools/executor.ts) and empty
 * results are filtered out so the chat never renders an empty card rail.
 */
export function parseToolResults(toolCalls: IToolCall[]): ParsedToolResult[] {
  const parsed: ParsedToolResult[] = [];

  for (const toolCall of toolCalls) {
    const { result } = toolCall;
    if (!result || (isRecord(result) && "error" in result)) continue;

    if (toolCall.name === TOOL_NAME.SEARCH_AIRCRAFT && isAircraftArray(result) && result.length > 0) {
      parsed.push({ kind: "aircraft", toolCall, aircraft: result });
      continue;
    }

    if (toolCall.name === TOOL_NAME.LOOKUP_AIRPORT && isAirportArray(result) && result.length > 0) {
      parsed.push({ kind: "airport", toolCall, airports: result });
      continue;
    }

    if (toolCall.name === TOOL_NAME.GET_COMPANY_INFO && isCompanyInfo(result)) {
      parsed.push({ kind: "company", toolCall, company: result });
      continue;
    }
  }

  return parsed;
}
