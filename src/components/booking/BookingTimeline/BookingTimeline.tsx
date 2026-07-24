import { Check } from "lucide-react";
import { BOOKING_STATUS_LABELS } from "@/database/constants/booking-status";
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
          <li key={`${entry.status}-${entry.changedAt}`} className="relative flex gap-4 pb-7 pl-1 last:pb-0">
            {index < timeline.length - 1 ? (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-sky-300 to-slate-200"
                aria-hidden="true"
              />
            ) : null}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                isLatest ? "bg-sky-500 text-navy-950 shadow-glow" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className={`text-sm font-medium ${isLatest ? "text-navy-900" : "text-slate-700"}`}>
                  {BOOKING_STATUS_LABELS[entry.status]}
                </p>
                {isLatest ? (
                  <span className="spec-readout text-[11px] uppercase tracking-wide text-sky-600">Current</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDateTime(entry.changedAt)} · {formatRelativeTime(entry.changedAt)}
              </p>
              {entry.note ? <p className="mt-1.5 text-sm text-slate-600">{entry.note}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
