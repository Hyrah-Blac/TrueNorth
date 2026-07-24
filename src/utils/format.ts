/** Normalizes a Kenyan phone number to +254XXXXXXXXX for storage/display consistency. */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");

  if (digits.startsWith("+254")) return digits;
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `+254${digits}`;

  return digits;
}

/** M-Pesa Daraja requires the 2547XXXXXXXX / 2541XXXXXXXX format without the plus sign. */
export function toMpesaPhoneFormat(phone: string): string {
  return normalizePhoneNumber(phone).replace("+", "");
}

export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map(capitalize)
    .join(" ");
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}…`;
}

export function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

export function pluralize(word: string, count: number, plural?: string): string {
  if (count === 1) return `${count} ${word}`;
  return `${count} ${plural ?? `${word}s`}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/** Converts a free-form label into a lowercase, hyphenated slug for display/search, not persistence. */
export function slugifyForDisplay(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Formats an enum-style value like "medical_evacuation" into "Medical Evacuation". */
export function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map(capitalize)
    .join(" ");
}

