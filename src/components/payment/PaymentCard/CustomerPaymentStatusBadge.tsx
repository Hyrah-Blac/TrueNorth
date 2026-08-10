import { StatusBadge, type BadgeTone } from "@/components/shared/badge/StatusBadge";
import { CUSTOMER_PAYMENT_STATUS_LABELS } from "@/lib/customerLabels";
import type { PaymentStatus } from "@/database/constants/payment-status";

const statusTone: Record<PaymentStatus, BadgeTone> = {
  pending: "neutral",
  processing: "info",
  completed: "success",
  failed: "danger",
  refunded: "gold",
};

export function CustomerPaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <StatusBadge tone={statusTone[status]} pulse={status === "processing"}>
      {CUSTOMER_PAYMENT_STATUS_LABELS[status]}
    </StatusBadge>
  );
}