import { StatusBadge, type BadgeTone } from "@/components/shared/badge/StatusBadge";
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/database/constants/payment-status";

const statusTone: Record<PaymentStatus, BadgeTone> = {
  pending: "neutral",
  processing: "info",
  completed: "success",
  failed: "danger",
  refunded: "gold",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <StatusBadge tone={statusTone[status]} pulse={status === "processing"}>
      {PAYMENT_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
