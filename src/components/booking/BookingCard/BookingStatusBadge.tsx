import { StatusBadge, type BadgeTone } from "@/components/shared/badge/StatusBadge";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/database/constants/booking-status";

const statusTone: Record<BookingStatus, BadgeTone> = {
  pending: "neutral",
  confirmed: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "danger",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <StatusBadge tone={statusTone[status]} pulse={status === "in_progress"}>
      {BOOKING_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
