import type { IMessage, IToolCall } from "@/types/ai";
import type { AircraftSummary } from "@/lib/ai/services/aircraft.service";
import type { AirportSummary } from "@/lib/ai/services/airport.service";
import type { CompanyInfo } from "@/lib/ai/services/company.service";

export type { IMessage, IToolCall, AircraftSummary, AirportSummary, CompanyInfo };

/**
 * Client-local message shape. Extends the persisted `IMessage` with a
 * `sent`/`streaming`/`failed` status: `streaming` marks the assistant's
 * reply while it's still being progressively filled in, `failed` flags
 * a send that needs a retry affordance. Once a reply completes it's
 * replaced with the server's own persisted message (status `sent`).
 */
export interface ConciergeMessage extends Omit<IMessage, "_id" | "conversationId" | "createdAt" | "updatedAt"> {
  _id: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
  status: "sent" | "streaming" | "failed";
}

export interface SuggestedQuestion {
  prompt: string;
}

export type ToolResultKind = "aircraft" | "airport" | "company" | "empty_aircraft" | "empty_airport" | "none";

/** Narrows a tool call's untyped `result` payload to a renderable shape + kind. */
export interface ParsedToolResult {
  kind: ToolResultKind;
  toolCall: IToolCall;
  aircraft?: AircraftSummary[];
  airports?: AirportSummary[];
  company?: CompanyInfo;
}

export type ConciergeErrorKind = "offline" | "timeout" | "rate_limited" | "server" | "unknown";

export interface ConciergeError {
  kind: ConciergeErrorKind;
  message: string;
}