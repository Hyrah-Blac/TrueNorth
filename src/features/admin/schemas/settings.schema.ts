import { z } from "zod";
import { GENERAL_PHONE_REGEX } from "@/utils/validators";

// Deliberately NOT in a "use server" file — zod schemas are plain values
// and must stay in plain modules so clients can import them.

const phoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(GENERAL_PHONE_REGEX, "Enter a valid phone number"));

const optionalPhoneField = phoneField.optional().or(z.literal(""));

const socialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(30),
  href: z.string().trim().url("Enter a valid URL").max(300),
  label: z.string().trim().min(1).max(100),
});

export const siteSettingsSchema = z.object({
  // Contact
  phone: phoneField,
  email: z.string().trim().email("Enter a valid email address"),
  whatsapp: optionalPhoneField,
  emergencyContact: optionalPhoneField,
  // Address
  addressLine1: z.string().trim().min(1, "Address is required").max(150),
  addressLine2: z.string().trim().max(150).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  country: z.string().trim().min(1, "Country is required").max(100),
  // Identity
  companyName: z.string().trim().min(1, "Company name is required").max(150),
  companyShortName: z.string().trim().max(60).optional().or(z.literal("")),
  companyDescription: z.string().trim().max(500).optional().or(z.literal("")),
  companyTagline: z.string().trim().max(200).optional().or(z.literal("")),
  // Operations
  operatingHours: z.string().trim().min(1, "Operating hours are required").max(200),
  // Social
  socialLinks: z.array(socialLinkSchema).max(10).default([]),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
