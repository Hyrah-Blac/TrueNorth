export const APP_TIMEZONE = "Africa/Nairobi";
const DEFAULT_LOCALE = "en-KE";

/** e.g. "18 Jul 2026" */
export function formatDate(date: Date | string, timeZone: string = APP_TIMEZONE): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(value);
}

/** e.g. "18 Jul 2026, 14:30" */
export function formatDateTime(date: Date | string, timeZone: string = APP_TIMEZONE): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(value);
}

/** e.g. "14:30" */
export function formatTime(date: Date | string, timeZone: string = APP_TIMEZONE): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(value);
}

/** yyyy-MM-dd, for <input type="date"> values */
export function formatDateForInput(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toISOString().slice(0, 10);
}

/** Human-friendly relative time, e.g. "in 3 days", "2 hours ago" */
export function formatRelativeTime(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const diffMs = value.getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);

  const divisions: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const rtf = new Intl.RelativeTimeFormat(DEFAULT_LOCALE, { numeric: "auto" });

  for (const [unit, secondsInUnit] of divisions) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === "second") {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }

  return rtf.format(0, "second");
}

export function addDays(date: Date | string, days: number): Date {
  const value = typeof date === "string" ? new Date(date) : new Date(date.getTime());
  value.setDate(value.getDate() + days);
  return value;
}

export function daysBetween(start: Date | string, end: Date | string): number {
  const startValue = typeof start === "string" ? new Date(start) : start;
  const endValue = typeof end === "string" ? new Date(end) : end;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((endValue.getTime() - startValue.getTime()) / msPerDay);
}

export function isFutureDate(date: Date | string): boolean {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.getTime() > Date.now();
}

export function isPastDate(date: Date | string): boolean {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.getTime() < Date.now();
}

/** True once `date` is more than `days` days in the past — used for e.g. quote expiry. */
export function isOlderThanDays(date: Date | string, days: number): boolean {
  return daysBetween(date, new Date()) > days;
}

