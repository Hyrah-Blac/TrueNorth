import type { IToolCall } from "@/types/ai";

/**
 * Name of the tool that submits a charter quote request. Kept as a
 * literal here rather than importing AI_TOOL_NAMES, since that constants
 * module lives in a server-only path (@/database/constants/ai) and this
 * helper runs client-side. Must stay in sync with
 * AI_TOOL_NAMES.SUBMIT_QUOTE_REQUEST's value ("submit_quote_request").
 */
const SUBMIT_QUOTE_REQUEST_TOOL = "submit_quote_request";

/**
 * True when this message's tool calls include a submit_quote_request —
 * used to suppress rendering aircraft/airport/company result cards and
 * follow-up suggestion chips on the confirmation message itself. Once a
 * quote has been submitted, re-showing "Compare with another aircraft"
 * or the same aircraft card the customer already saw a moment ago reads
 * as clutter after a completed transaction, not as help.
 */
export function hasSubmittedQuote(toolCalls: IToolCall[]): boolean {
  return toolCalls.some((tc) => tc.name === SUBMIT_QUOTE_REQUEST_TOOL);
}

/**
 * Heuristic match for the workflow-step-6 confirmation-ask message (see
 * buildSystemPrompt's Quotation Workflow) — a short trip summary ending
 * in a yes/no question like "Shall I go ahead and submit this request?"
 * Used to suppress the follow-up suggestion chips ("Compare with another
 * aircraft", "Get a quotation") on that specific message: offering
 * tangential next steps right under a direct yes/no question invites the
 * customer to wander off instead of just answering it.
 *
 * This is a text-pattern heuristic, not a guaranteed signal — there's no
 * dedicated flag from the backend marking "this turn is a confirmation
 * ask" (the guard in chat.service.ts prevents the tool call, but doesn't
 * currently tag the message itself). False negatives just mean the chips
 * show up when they ideally wouldn't; false positives just hide chips
 * that would have been harmless. Neither is a correctness problem, only
 * a polish one — if this proves unreliable in practice, the more robust
 * fix is a dedicated `awaitingConfirmation` field set server-side.
 */
const CONFIRMATION_ASK_PATTERN = /\b(shall i|go ahead|confirm|proceed)\b[\s\S]*\?\s*$/i;

export function isPendingConfirmation(content: string): boolean {
  return CONFIRMATION_ASK_PATTERN.test(content.trim());
}