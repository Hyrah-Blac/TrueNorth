export const QUOTE_STATUSES = {
  PENDING: "pending",
  REVIEWING: "reviewing",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  CONVERTED: "converted",
} as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[keyof typeof QUOTE_STATUSES];

export const QUOTE_STATUS_VALUES = Object.values(QUOTE_STATUSES) as QuoteStatus[];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: "Pending Review",
  reviewing: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  converted: "Converted to Booking",
};

// Terminal states — no further transitions expected from these.
export const QUOTE_TERMINAL_STATUSES: QuoteStatus[] = [
  QUOTE_STATUSES.REJECTED,
  QUOTE_STATUSES.EXPIRED,
  QUOTE_STATUSES.CONVERTED,
];

