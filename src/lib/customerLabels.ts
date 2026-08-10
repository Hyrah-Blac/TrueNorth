/**
 * Customer-facing display labels for statuses.
 * These are ONLY used in the customer portal UI — database values are never changed.
 * Internal admin views continue using the technical labels from the constants files.
 */

import type { BookingStatus } from "@/database/constants/booking-status";
import type { QuoteStatus } from "@/database/constants/quote-status";
import type { PaymentStatus } from "@/database/constants/payment-status";
import type { BookingPaymentStatus } from "@/utils/currency";

export const CUSTOMER_BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Awaiting Payment",
  confirmed: "Charter Confirmed",
  in_progress: "Flight in Progress",
  completed: "Charter Completed",
  cancelled: "Cancelled",
};

export const CUSTOMER_QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: "Request Received",
  reviewing: "Being Reviewed",
  approved: "Quote Ready",
  rejected: "Not Available",
  expired: "Quote Expired",
  converted: "Booking Created",
};

export const CUSTOMER_PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Awaiting Payment",
  processing: "Confirming Payment",
  completed: "Payment Received",
  failed: "Payment Failed",
  refunded: "Refunded",
};

export const CUSTOMER_BOOKING_PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  unpaid: "Payment Required",
  partially_paid: "Partially Paid",
  paid: "Fully Paid",
};