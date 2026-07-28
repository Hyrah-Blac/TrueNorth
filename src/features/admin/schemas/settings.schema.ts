import { z } from "zod";
import { GENERAL_PHONE_REGEX } from "@/utils/validators";

// Deliberately NOT in a "use server" file. Files marked "use server" may
// only export async functions — every export gets compiled into a
// server-action reference. A zod schema (or any other plain value)
// exported from such a file breaks silently on the client: the browser
// gets a stub instead of the real schema, and zodResolver blows up at
// runtime trying to call .parse/.parseAsync on it. Keep this schema here,
// in a plain module, and import it from both the server action and the
// client form.

// Phone numbers are naturally typed/pasted with spaces or dashes
// (e.g. "+254 708 892 669"). Strip those before testing against
// GENERAL_PHONE_REGEX, which only accepts a leading "+" and digits —
// otherwise every normally-formatted number gets rejected.
const phoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(GENERAL_PHONE_REGEX, "Enter a valid phone number"));

export const siteSettingsSchema = z.object({
  phone: phoneField,
  email: z.string().trim().email("Enter a valid email address"),
  whatsapp: phoneField.optional().or(z.literal("")),
  addressLine1: z.string().trim().min(1, "Address is required").max(150),
  addressLine2: z.string().trim().max(150).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  country: z.string().trim().min(1, "Country is required").max(100),
  operatingHours: z.string().trim().min(1, "Operating hours are required").max(200),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;