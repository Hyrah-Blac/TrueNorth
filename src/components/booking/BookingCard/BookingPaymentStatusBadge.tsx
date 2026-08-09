import { StatusBadge, type BadgeTone } from "@/components/shared/badge/StatusBadge";
import { BOOKING_PAYMENT_STATUS_LABELS, type BookingPaymentStatus } from "@/utils/currency";

const statusTone: Record<BookingPaymentStatus, BadgeTone> = {
  unpaid: "neutral",
  partially_paid: "warning",
  paid: "success",
};

export function BookingPaymentStatusBadge({ status }: { status: BookingPaymentStatus }) {
  return <StatusBadge tone={statusTone[status]}>{BOOKING_PAYMENT_STATUS_LABELS[status]}</StatusBadge>;
}
