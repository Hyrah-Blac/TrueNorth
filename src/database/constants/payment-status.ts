export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUSES) as PaymentStatus[];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_METHODS = {
  MPESA: "mpesa",
  CARD: "card",
  BANK_TRANSFER: "bank_transfer",
  CASH: "cash",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHODS) as PaymentMethod[];

/**
 * Which system actually processed a payment. `mpesa` covers historical
 * payments taken via the direct Safaricom Daraja STK Push integration;
 * `paystack` covers payments taken through Paystack (which itself may
 * route the charge over M-Pesa or a card — see `method` for that).
 * Defaults to `mpesa` so existing pre-Paystack Payment records (which
 * predate this field) are still valid without a migration.
 */
export const PAYMENT_PROVIDERS = {
  MPESA: "mpesa",
  PAYSTACK: "paystack",
} as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

export const PAYMENT_PROVIDER_VALUES = Object.values(PAYMENT_PROVIDERS) as PaymentProvider[];

/**
 * Tracks the BOOKING SIDE-EFFECT state (crediting paidAmount,
 * auto-confirming, issuing the ticket, sending the receipt) as a
 * concept fully separate from the payment's own financial `status`.
 * See Payment.ts's bookingCreditStatus field and
 * creditBookingForPayment.ts for why this split exists.
 */
export const BOOKING_CREDIT_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type BookingCreditStatus = (typeof BOOKING_CREDIT_STATUSES)[keyof typeof BOOKING_CREDIT_STATUSES];

export const BOOKING_CREDIT_STATUS_VALUES = Object.values(BOOKING_CREDIT_STATUSES) as BookingCreditStatus[];

/**
 * HARDENING — tracks the receipt-email attempt as its own, fully
 * independent piece of state, separate from bookingCreditStatus
 * above. A notification failure must never look like — or cause a
 * retry of — a booking-credit failure; see Payment.ts's
 * receiptNotificationStatus field and creditBookingForPayment.ts.
 */
export const RECEIPT_NOTIFICATION_STATUSES = {
  NOT_SENT: "not_sent",
  SENT: "sent",
  FAILED: "failed",
} as const;

export type ReceiptNotificationStatus =
  (typeof RECEIPT_NOTIFICATION_STATUSES)[keyof typeof RECEIPT_NOTIFICATION_STATUSES];

export const RECEIPT_NOTIFICATION_STATUS_VALUES = Object.values(
  RECEIPT_NOTIFICATION_STATUSES
) as ReceiptNotificationStatus[];

