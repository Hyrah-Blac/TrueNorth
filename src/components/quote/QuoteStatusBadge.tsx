import { StatusBadge, type BadgeTone } from "@/components/shared/badge/StatusBadge";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/database/constants/quote-status";

const statusTone: Record<QuoteStatus, BadgeTone> = {
  pending: "neutral",
  reviewing: "info",
  approved: "success",
  rejected: "danger",
  expired: "neutral",
  converted: "gold",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <StatusBadge tone={statusTone[status]} pulse={status === "reviewing"}>
      {QUOTE_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
