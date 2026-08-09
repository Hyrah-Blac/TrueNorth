import { StatusBadge, type BadgeTone } from "@/components/shared/badge/StatusBadge";
import { CUSTOMER_BOOKING_STATUS_LABELS } from "@/lib/customerLabels";
import type { BookingStatus } from "@/database/constants/booking-status";

const statusTone: Record<BookingStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "success",
  in_progress: "info",
  completed: "neutral",
  cancelled: "danger",
};

export function CustomerBookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <StatusBadge tone={statusTone[status]} pulse={status === "in_progress"}>
      {CUSTOMER_BOOKING_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
