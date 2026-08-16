export const TICKET_EMAIL_STATUSES = {
  NOT_SENT: "not_sent",
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
} as const;

export type TicketEmailStatus = (typeof TICKET_EMAIL_STATUSES)[keyof typeof TICKET_EMAIL_STATUSES];

export const TICKET_EMAIL_STATUS_VALUES = Object.values(TICKET_EMAIL_STATUSES) as TicketEmailStatus[];
