import { Headset } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2" role="status" aria-label="Concierge is typing">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
        <Headset className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div className="flex items-center gap-1 pl-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
      </div>
    </div>
  );
}