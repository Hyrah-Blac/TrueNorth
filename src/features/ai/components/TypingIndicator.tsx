import { Headset } from "lucide-react";

export function TypingIndicator({ label }: { label?: string | null }) {
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={label ?? "AI Concierge is typing"}
    >
      {/* rounded-xl + champagne gradient — same persona-marker treatment
          as the avatar in MessageBubble and ConciergeHeader, so the
          concierge reads as the same "character" everywhere it shows up. */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-champagne-500 to-champagne-600 text-navy-950 shadow-crisp">
        <Headset className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
      </div>
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