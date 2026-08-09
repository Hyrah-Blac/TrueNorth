import { Check } from "lucide-react";
import { CUSTOMER_BOOKING_STATUS_LABELS } from "@/lib/customerLabels";
import { formatDateTime, formatRelativeTime } from "@/utils/date";
import type { IBookingTimelineEntry } from "@/types/booking";

export function BookingTimeline({ timeline }: { timeline: IBookingTimelineEntry[] }) {
  if (timeline.length === 0) return null;

  const latestIndex = timeline.length - 1;

  return (
    <ol className="space-y-0">
      {timeline.map((entry, index) => {
        const isLatest = index === latestIndex;

        return (
          <li key={`${entry.status}-${entry.changedAt}`} className="relative flex gap-4 pb-7 last:pb-0">
            {index < timeline.length - 1 ? (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-sky-200 to-slate-100"
                aria-hidden="true"
              />
            ) : null}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                isLatest
                  ? "bg-navy-950 text-white shadow-crisp"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className={`text-sm font-semibold ${isLatest ? "text-navy-900" : "text-slate-600"}`}>
                  {CUSTOMER_BOOKING_STATUS_LABELS[entry.status] ?? entry.status}
                </p>
                {isLatest ? (
                  <span className="spec-readout text-[10px] font-medium uppercase tracking-wider text-sky-600">
                    Current
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {formatDateTime(entry.changedAt)} · {formatRelativeTime(entry.changedAt)}
              </p>
              {entry.note ? (
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{entry.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
