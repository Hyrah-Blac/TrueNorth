import { StatusBadge, type BadgeTone } from "@/components/shared/badge/StatusBadge";
import { CUSTOMER_BOOKING_PAYMENT_STATUS_LABELS } from "@/lib/customerLabels";
import type { BookingPaymentStatus } from "@/utils/currency";

const statusTone: Record<BookingPaymentStatus, BadgeTone> = {
  unpaid: "warning",
  partially_paid: "warning",
  paid: "success",
};

export function CustomerBookingPaymentStatusBadge({ status }: { status: BookingPaymentStatus }) {
  return (
    <StatusBadge tone={statusTone[status]}>
      {CUSTOMER_BOOKING_PAYMENT_STATUS_LABELS[status]}
    </StatusBadge>
  );
}