export const BOOKING_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[keyof typeof BOOKING_STATUSES];

export const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUSES) as BookingStatus[];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending Confirmation",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BOOKING_TERMINAL_STATUSES: BookingStatus[] = [
  BOOKING_STATUSES.COMPLETED,
  BOOKING_STATUSES.CANCELLED,
];

