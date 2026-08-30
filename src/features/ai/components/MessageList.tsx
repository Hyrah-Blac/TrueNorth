import { useMemo } from "react";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ErrorState } from "./ErrorState";
import { FollowUpSuggestions } from "./FollowUpSuggestions";
import { CompassWatermark } from "./CompassWatermark";
import { hasSubmittedQuote, isPendingConfirmation } from "../lib/quoteStatus";
import { parseToolResults } from "../lib/toolResults";
import type { ConciergeError, ConciergeMessage } from "../types";

interface MessageListProps {
  messages: ConciergeMessage[];
  isSending: boolean;
  toolStatusLabel: string | null;
  error: ConciergeError | null;
  onRetry: () => void;
}

/** Aircraft/airport `_id`s carried by a single message's tool results, in
 *  the shape ToolResultRail already renders them as. Reuses the same
 *  parseToolResults every card render goes through, rather than
 *  reimplementing result-shape knowledge here. */
function extractShownIds(message: ConciergeMessage): { aircraftIds: string[]; airportIds: string[] } {
  if (!message.toolCalls.length) return { aircraftIds: [], airportIds: [] };

  const results = parseToolResults(message.toolCalls);
  const aircraftIds: string[] = [];
  const airportIds: string[] = [];

  for (const result of results) {
    if (result.kind === "aircraft" && result.aircraft) {
      aircraftIds.push(...result.aircraft.map((a) => a._id));
    }
    if (result.kind === "airport" && result.airports) {
      airportIds.push(...result.airports.map((a) => a._id));
    }
  }

  return { aircraftIds, airportIds };
}

export function MessageList({ messages, isSending, toolStatusLabel, error, onRetry }: MessageListProps) {
  const lastMessage = messages[messages.length - 1];
  const isStreamingReply = isSending && lastMessage?.status === "streaming" && Boolean(lastMessage.content);
  const scrollRef = useAutoScroll(
    `${messages.length}-${lastMessage?.content.length ?? 0}-${isSending}-${toolStatusLabel ?? ""}-${error?.message ?? ""}`,
    isStreamingReply
  );

  // The typing indicator owns the moment before any reply text exists —
  // once the streaming placeholder has content, the growing bubble
  // itself is the "in progress" signal, so the indicator steps aside.
  const showTypingIndicator = isSending && lastMessage?.status === "streaming" && !lastMessage.content;
  // Follow-up chips ("Compare with another aircraft", "Get a quotation")
  // don't make sense right after the quote has just been submitted, or
  // right under a direct yes/no confirmation question — both cases
  // suppress this row so the customer's attention stays on the actual
  // decision in front of them.
  const showFollowUps =
    !isSending &&
    !error &&
    lastMessage?.role === "assistant" &&
    lastMessage.status === "sent" &&
    !hasSubmittedQuote(lastMessage.toolCalls) &&
    !isPendingConfirmation(lastMessage.content);

  // Per-message snapshot of every aircraft/airport `_id` already shown in
  // an EARLIER message — passed to each MessageBubble so ToolResultRail
  // can filter out a duplicate card even when the underlying tool call
  // legitimately re-ran with different arguments (e.g. once mission type
  // becomes known). Deliberately captures "seen before this message", not
  // "seen including this message" — a message should never suppress its
  // own new content, only repeats of what came earlier.
  const seenIdsPerMessage = useMemo(() => {
    const aircraftSeen = new Set<string>();
    const airportSeen = new Set<string>();
    const snapshots: Array<{ aircraftIds: Set<string>; airportIds: Set<string> }> = [];

    for (const message of messages) {
      snapshots.push({ aircraftIds: new Set(aircraftSeen), airportIds: new Set(airportSeen) });
      const { aircraftIds, airportIds } = extractShownIds(message);
      aircraftIds.forEach((id) => aircraftSeen.add(id));
      airportIds.forEach((id) => airportSeen.add(id));
    }

    return snapshots;
  }, [messages]);

  return (
    // relative wrapper holds the watermark fixed in place; the scroll
    // container inside is transparent so the compass reads as "behind
    // the conversation" rather than scrolling away with the messages.
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden text-navy-900/[0.045]"
        aria-hidden="true"
      >
        <div className="h-[440px] w-[440px] shrink-0 sm:h-[520px] sm:w-[520px]">
          <CompassWatermark />
        </div>
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with AI Concierge"
        className="relative h-full overflow-y-auto px-6 py-6 sm:px-10"
      >
        <div className="flex flex-col gap-6">
          {messages.map((message, index) => (
            <MessageBubble
              key={message._id}
              message={message}
              seenAircraftIds={seenIdsPerMessage[index]?.aircraftIds}
              seenAirportIds={seenIdsPerMessage[index]?.airportIds}
            />
          ))}
          {showTypingIndicator ? <TypingIndicator label={toolStatusLabel} /> : null}
          {error ? <ErrorState error={error} onRetry={onRetry} /> : null}
          {showFollowUps ? <FollowUpSuggestions message={lastMessage} /> : null}
        </div>
      </div>
    </div>
  );
}