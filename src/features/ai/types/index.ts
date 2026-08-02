import type { IMessage, IToolCall } from "@/types/ai";
import type { AircraftSummary } from "@/lib/ai/services/aircraft.service";
import type { AirportSummary } from "@/lib/ai/services/airport.service";
import type { CompanyInfo } from "@/lib/ai/services/company.service";

export type { IMessage, IToolCall, AircraftSummary, AirportSummary, CompanyInfo };

/**
 * Client-local message shape. Extends the persisted `IMessage` with a
 * `sent`/`failed` status so a failed send can be flagged with a retry
 * affordance — the in-flight state itself is communicated separately via
 * the typing indicator, not stored on the message.
 */
export interface ConciergeMessage extends Omit<IMessage, "_id" | "conversationId" | "createdAt" | "updatedAt"> {
  _id: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
  status: "sent" | "failed";
}

export interface SuggestedQuestion {
  prompt: string;
}

export type ToolResultKind = "aircraft" | "airport" | "company" | "none";

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
