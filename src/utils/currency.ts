const DEFAULT_CURRENCY = "KES";
const DEFAULT_LOCALE = "en-KE";

/**
 * Formats a numeric amount as currency, e.g. formatCurrency(125000) -> "KSh 125,000".
 * Falls back gracefully for currencies Intl doesn't recognize a symbol for.
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options?: { showDecimals?: boolean }
): string {
  const showDecimals = options?.showDecimals ?? false;

  try {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  } catch {
    // Unknown currency code — fall back to a plain number with the code prefixed.
    return `${currency} ${amount.toLocaleString(DEFAULT_LOCALE)}`;
  }
}

/**
 * Formats a budget range for display, e.g. "KSh 500,000 – KSh 800,000"
 * or just one bound if only min/max is set.
 */
export function formatBudgetRange(
  min?: number,
  max?: number,
  currency: string = DEFAULT_CURRENCY
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
  }
  if (min != null) return `From ${formatCurrency(min, currency)}`;
  return `Up to ${formatCurrency(max as number, currency)}`;
}

/** Rounds to the nearest whole unit — M-Pesa STK Push requires integer KES amounts. */
export function toWholeCurrencyUnit(amount: number): number {
  return Math.round(amount);
}

/**
 * Converts a major-unit amount (e.g. KES 1,500) to the integer subunit
 * Paystack's API requires (e.g. 150000 cents). Paystack expects every
 * currency it supports — including KES — in its smallest unit, so this
 * always multiplies by 100, never sends a fractional amount, and never
 * lets a floating-point amount reach the API layer.
 */
export function toPaystackSubunit(amount: number): number {
  return Math.round(amount * 100);
}

/** Converts a Paystack subunit amount back to the application's major-unit representation. */
export function fromPaystackSubunit(amount: number): number {
  return Math.round(amount) / 100;
}

export function calculateBalance(totalAmount: number, paidAmount: number): number {
  return Math.max(toWholeCurrencyUnit(totalAmount - paidAmount), 0);
}

export function calculatePaymentProgress(totalAmount: number, paidAmount: number): number {
  if (totalAmount <= 0) return 0;
  return Math.min(Math.round((paidAmount / totalAmount) * 100), 100);
}

export type BookingPaymentStatus = "unpaid" | "partially_paid" | "paid";

export const BOOKING_PAYMENT_STATUS_VALUES: BookingPaymentStatus[] = ["unpaid", "partially_paid", "paid"];

export const BOOKING_PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
};

/**
 * A booking's financial state, kept distinct from its operational
 * `status` (pending/confirmed/in_progress/...). There's no separate
 * "payment status" field on Booking — this derives one from the same
 * totalAmount/paidAmount already used for the balance, so the UI can
 * show "Booking: Confirmed" and "Payment: Partially Paid" side by side
 * without those two concepts ever being conflated.
 */
export function getBookingPaymentStatus(totalAmount: number, paidAmount: number): BookingPaymentStatus {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= totalAmount) return "paid";
  return "partially_paid";
}

/**
 * MongoDB filter equivalent of getBookingPaymentStatus, for server-side
 * filtering (admin booking list) without loading every booking into
 * memory just to compute a derived status in JS. The thresholds here
 * must stay identical to getBookingPaymentStatus above — paidAmount<=0
 * is unpaid, paidAmount>=totalAmount is paid, otherwise partial.
 */
export function getBookingPaymentStatusFilter(status: BookingPaymentStatus): Record<string, unknown> {
  switch (status) {
    case "unpaid":
      return { paidAmount: { $lte: 0 } };
    case "paid":
      return { $expr: { $gte: ["$paidAmount", "$totalAmount"] } };
    case "partially_paid":
      return { paidAmount: { $gt: 0 }, $expr: { $lt: ["$paidAmount", "$totalAmount"] } };
  }
}

