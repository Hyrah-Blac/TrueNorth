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

export function calculateBalance(totalAmount: number, paidAmount: number): number {
  return Math.max(toWholeCurrencyUnit(totalAmount - paidAmount), 0);
}

export function calculatePaymentProgress(totalAmount: number, paidAmount: number): number {
  if (totalAmount <= 0) return 0;
  return Math.min(Math.round((paidAmount / totalAmount) * 100), 100);
}

