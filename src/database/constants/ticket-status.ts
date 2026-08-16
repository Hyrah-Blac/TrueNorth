export const TICKET_STATUSES = {
  ISSUED: "issued",
  CANCELLED: "cancelled",
  INVALIDATED: "invalidated",
} as const;

export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

export const TICKET_STATUS_VALUES = Object.values(TICKET_STATUSES) as TicketStatus[];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  issued: "Issued",
  cancelled: "Cancelled",
  invalidated: "Invalidated",
};

// Terminal states — a ticket in one of these will never become ISSUED again.
export const TICKET_TERMINAL_STATUSES: TicketStatus[] = [
  TICKET_STATUSES.CANCELLED,
  TICKET_STATUSES.INVALIDATED,
];
