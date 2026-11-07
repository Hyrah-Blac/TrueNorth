import { ConciergeRobot } from "./ConciergeRobot";

export function TypingIndicator({ label }: { label?: string | null }) {
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={label ?? "AI Concierge is typing"}
    >
      {/* Robot mascot — same persona marker as MessageBubble and
          ConciergeHeader, so the concierge reads as one character. */}
      <ConciergeRobot className="h-7 w-7 shrink-0 drop-shadow-[0_2px_3px_rgba(15,23,42,0.25)]" />
      {label ? (
        <span className="font-body text-xs text-slate-500">{label}</span>
      ) : (
        // A slow, staggered breathing pulse rather than bouncing dots —
        // bounce reads as a generic chat-widget default; this is calmer
        // and, in the champagne persona color, feels like it belongs to
        // this concierge specifically rather than to chat UI in general.
        <div className="flex items-center gap-1.5 pl-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-champagne-500 [animation-delay:-0.6s] [animation-duration:1.4s]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-champagne-500 [animation-delay:-0.3s] [animation-duration:1.4s]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-champagne-500 [animation-duration:1.4s]" />
        </div>
      )}
    </div>
  );
}