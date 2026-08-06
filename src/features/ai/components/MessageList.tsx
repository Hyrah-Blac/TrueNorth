import { useAutoScroll } from "../hooks/useAutoScroll";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ErrorState } from "./ErrorState";
import { FollowUpSuggestions } from "./FollowUpSuggestions";
import { CompassWatermark } from "./CompassWatermark";
import { hasSubmittedQuote, isPendingConfirmation } from "../lib/quoteStatus";
import type { ConciergeError, ConciergeMessage } from "../types";

interface MessageListProps {
  messages: ConciergeMessage[];
  isSending: boolean;
  toolStatusLabel: string | null;
  error: ConciergeError | null;
  onRetry: () => void;
}

export function MessageList({ messages, isSending, toolStatusLabel, error, onRetry }: MessageListProps) {
  const lastMessage = messages[messages.length - 1];
  const scrollRef = useAutoScroll(
    `${messages.length}-${lastMessage?.content.length ?? 0}-${isSending}-${toolStatusLabel ?? ""}-${error?.message ?? ""}`
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
          {messages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))}
          {showTypingIndicator ? <TypingIndicator label={toolStatusLabel} /> : null}
          {error ? <ErrorState error={error} onRetry={onRetry} /> : null}
          {showFollowUps ? <FollowUpSuggestions message={lastMessage} /> : null}
        </div>
      </div>
    </div>
  );
}