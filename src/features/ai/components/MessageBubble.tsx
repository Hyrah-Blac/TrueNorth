import { memo, useMemo } from "react";
import { AlertTriangle, Compass } from "lucide-react";
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
        <div className="max-w-[82%] break-words rounded-lg rounded-tr-sm bg-navy-950 px-4 py-2.5 text-sm leading-relaxed text-white">
          {message.content}
        </div>
        <div className="flex items-center gap-1.5 pr-1 text-[10px] uppercase tracking-wide text-slate-400">
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

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white">
          <Compass className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <span className="font-display text-xs font-medium uppercase tracking-wide text-slate-500">
          AI Concierge
        </span>
        <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
      </div>

      <div className="break-words pl-8 text-sm leading-relaxed text-slate-800 [&_p+p]:mt-3">
        {renderedContent}
      </div>

      {message.toolCalls.length > 0 ? (
        <div className="pl-8">
          <ToolResultRail toolCalls={message.toolCalls} />
        </div>
      ) : null}
    </div>
  );
});
