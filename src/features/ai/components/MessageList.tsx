import { useAutoScroll } from "../hooks/useAutoScroll";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ErrorState } from "./ErrorState";
import { FollowUpSuggestions } from "./FollowUpSuggestions";
import type { ConciergeError, ConciergeMessage } from "../types";

interface MessageListProps {
  messages: ConciergeMessage[];
  isSending: boolean;
  error: ConciergeError | null;
  onRetry: () => void;
}

export function MessageList({ messages, isSending, error, onRetry }: MessageListProps) {
  const scrollRef = useAutoScroll(`${messages.length}-${isSending}-${error?.message ?? ""}`);
  const lastMessage = messages[messages.length - 1];
  const showFollowUps = !isSending && !error && lastMessage?.role === "assistant";

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label="Conversation with Concierge"
      className="flex-1 overflow-y-auto px-6 py-6 sm:px-10"
    >
      <div className="flex flex-col gap-6">
        {messages.map((message) => (
          <MessageBubble key={message._id} message={message} />
        ))}
        {isSending ? <TypingIndicator /> : null}
        {error ? <ErrorState error={error} onRetry={onRetry} /> : null}
        {showFollowUps ? <FollowUpSuggestions message={lastMessage} /> : null}
      </div>
    </div>
  );
}