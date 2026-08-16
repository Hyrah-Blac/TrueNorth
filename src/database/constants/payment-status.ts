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

