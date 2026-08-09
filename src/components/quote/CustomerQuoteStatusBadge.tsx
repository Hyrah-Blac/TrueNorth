import { StatusBadge, type BadgeTone } from "@/components/shared/badge/StatusBadge";
import { CUSTOMER_QUOTE_STATUS_LABELS } from "@/lib/customerLabels";
import type { QuoteStatus } from "@/database/constants/quote-status";

const statusTone: Record<QuoteStatus, BadgeTone> = {
  pending: "neutral",
  reviewing: "info",
  approved: "success",
  rejected: "danger",
  expired: "neutral",
  converted: "gold",
};

export function CustomerQuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <StatusBadge tone={statusTone[status]} pulse={status === "reviewing" || status === "approved"}>
      {CUSTOMER_QUOTE_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
