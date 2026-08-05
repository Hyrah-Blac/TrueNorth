import { useAutoScroll } from "../hooks/useAutoScroll";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ErrorState } from "./ErrorState";
import { FollowUpSuggestions } from "./FollowUpSuggestions";
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
  const showFollowUps = !isSending && !error && lastMessage?.role === "assistant" && lastMessage.status === "sent";

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label="Conversation with AI Concierge"
      className="flex-1 overflow-y-auto px-6 py-6 sm:px-10"
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
  );
}