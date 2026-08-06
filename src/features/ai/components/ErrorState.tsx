import { WifiOff, Clock, Gauge, ServerCrash, AlertCircle, RotateCcw } from "lucide-react";
import type { ConciergeError } from "../types";

const ERROR_ICONS: Record<ConciergeError["kind"], typeof AlertCircle> = {
  offline: WifiOff,
  timeout: Clock,
  rate_limited: Gauge,
  server: ServerCrash,
  unknown: AlertCircle,
};

export function ErrorState({ error, onRetry }: { error: ConciergeError; onRetry: () => void }) {
  const Icon = ERROR_ICONS[error.kind];

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 shadow-crisp"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-body leading-relaxed text-red-700">{error.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest2 text-red-700 underline decoration-red-300 underline-offset-2 transition-colors hover:text-red-800"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}