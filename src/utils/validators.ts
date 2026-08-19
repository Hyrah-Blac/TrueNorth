export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const KENYAN_PHONE_REGEX = /^\+?(?:254|0)?7\d{8}$|^\+?(?:254|0)?1\d{8}$/;
export const GENERAL_PHONE_REGEX = /^\+?[0-9]{9,15}$/;
export const AIRPORT_CODE_REGEX = /^[A-Z]{3,4}$/;
export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
export const MPESA_TRANSACTION_ID_REGEX = /^[A-Z0-9]{10}$/;
// 24-hour "HH:MM" — matches the native <input type="time"> value format
// exactly (e.g. "09:30", "17:05"). Shared by the quote-approval and
// booking trip-details schemas so a departure time entered at either
// point (see ApproveQuoteDialog.tsx / BookingTripDetailsActions.tsx)
// is validated identically.
export const LOCAL_TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPhoneNumber(value: string, kenyanOnly = false): boolean {
  const regex = kenyanOnly ? KENYAN_PHONE_REGEX : GENERAL_PHONE_REGEX;
  return regex.test(value.trim());
}

export function isValidAirportCode(value: string): boolean {
  return AIRPORT_CODE_REGEX.test(value.trim().toUpperCase());
}

export function isValidObjectId(value: string): boolean {
  return OBJECT_ID_REGEX.test(value);
}

export function isValidDateRange(start: string | Date, end?: string | Date | null): boolean {
  if (!end) return true;
  const startValue = new Date(start).getTime();
  const endValue = new Date(end).getTime();
  return endValue >= startValue;
}

/**
 * Strips HTML tags and control characters from free-text input before
 * persisting. This is a defense-in-depth measure for fields rendered
 * as plain text (e.g. special requests, contact messages) — it is not
 * a substitute for output encoding when rendering user content.
 */
export function sanitizePlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Escapes regex metacharacters so a raw user-supplied string can be
 * safely dropped into a Mongo `$regex` filter (e.g. admin search
 * boxes) without two problems: (1) a crafted pattern like `(a+)+$`
 * causing catastrophic backtracking (ReDoS) against every document
 * scanned, and (2) metacharacters like `.` or `|` matching more than
 * the literal text the user typed. Always wrap search input with this
 * before using it in `$regex` — never interpolate it raw.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}