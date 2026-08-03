import { Headset, X, RotateCcw } from "lucide-react";

interface ConciergeHeaderProps {
  onClose: () => void;
  onNewConversation: () => void;
  hasConversation: boolean;
}

export function ConciergeHeader({
  onClose,
  onNewConversation,
  hasConversation,
}: ConciergeHeaderProps) {
  return (
    <div
      style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
      className="flex items-center justify-between border-b border-slate-100 px-6 pb-5 sm:px-10"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <Headset className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-green-500">
            <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-500/60" />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 id="concierge-panel-title" className="font-display text-sm font-semibold text-navy-900">
              True North Concierge
            </h2>
            <span className="text-[10px] uppercase tracking-wide text-green-600">Online</span>
          </div>
          <p className="text-xs text-slate-500">Your personal charter aviation assistant.</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {hasConversation ? (
          <button
            type="button"
            onClick={onNewConversation}
            aria-label="Start a new conversation"
            title="Start a new conversation"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-700 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Concierge"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-700 active:scale-95"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}