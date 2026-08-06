import { memo, useMemo } from "react";
import { AlertTriangle, Headset } from "lucide-react";
import { formatTime } from "@/utils/date";
import { renderMarkdown } from "../lib/markdown";
import { ToolResultRail } from "./cards/ToolResultRail";
import type { ConciergeMessage } from "../types";

/**
 * Memoized because message objects are never mutated in place (see
 * ConciergeContext) — every prior bubble's props stay referentially
 * identical across renders, so this skips re-parsing markdown and
 * re-rendering tool-result cards for the whole conversation every time a
 * new message arrives or the typing indicator toggles.
 */
export const MessageBubble = memo(function MessageBubble({ message }: { message: ConciergeMessage }) {
  const isUser = message.role === "user";
  const renderedContent = useMemo(() => renderMarkdown(message.content), [message.content]);

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {/* rounded-2xl (soft, premium) with a tightened top-right corner
            keeps the "tail" cue that this bubble points toward the
            user's own avatar/side, same soft-edge language as
            ConciergePanel. shadow-crisp is the brand token, replacing
            the one-off inline shadow string. */}
        <div className="max-w-[82%] break-words rounded-2xl rounded-tr-md bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-body leading-relaxed text-white shadow-crisp">
          {message.content}
        </div>
        <div className="flex items-center gap-1.5 pr-1 text-[10px] uppercase tracking-widest2 text-slate-400">
          {message.status === "failed" ? (
            <span className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Not sent
            </span>
          ) : (
            formatTime(message.createdAt)
          )}
        </div>
      </div>
    );
  }

  // Before any content has arrived, MessageList's typing indicator owns
  // this moment (with the tool-aware label) — an empty header row here
  // would just duplicate it.
  if (message.status === "streaming" && !message.content) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {/* rounded-xl, not rounded-full — the concierge avatar is a
            persona marker, not a button, so it gets the brand's
            "elegant rectangle" treatment rather than a circle. Gradient
            + shadow-crisp echoes the premium direction from the panel
            and the user bubble above. */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-champagne-500 to-champagne-600 text-navy-950 shadow-crisp">
          <Headset className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <span className="font-display text-xs font-medium uppercase tracking-widest2 text-slate-500">
          AI Concierge
        </span>
        <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
      </div>

      <div className="break-words pl-8 text-sm font-body leading-relaxed text-slate-800 [&_p+p]:mt-3">
        {renderedContent}
        {message.status === "streaming" ? (
          <span
            className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-blue-500 motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {message.toolCalls.length > 0 ? (
        <div className="pl-8">
          <ToolResultRail toolCalls={message.toolCalls} />
        </div>
      ) : null}
    </div>
  );
});