import "server-only";
import connectToDatabase from "@/database/connection";
import SiteSettings from "@/database/models/SiteSettings";
import { siteConfig } from "./site";

// Fixed, known ObjectId so there is always exactly one settings
// document — reads and writes both target this same _id rather than
// querying/creating by some other criterion.
export const SITE_SETTINGS_ID = "000000000000000000000001";

export interface ResolvedSiteSettings {
  phone: string;
  email: string;
  whatsapp?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  operatingHours: string;
}

/**
 * Shape expected by the `contact` prop on email templates
 * (src/emails/*.tsx) — a small projection of ResolvedSiteSettings.
 * Centralized here so every email-sending call site builds it the
 * same way instead of repeating the field mapping.
 */
export function toEmailContact(settings: ResolvedSiteSettings) {
  return {
    email: settings.email,
    addressLine1: settings.addressLine1,
    addressLine2: settings.addressLine2,
    city: settings.city,
    country: settings.country,
  };
}

/**
 * Returns admin-configured site settings, falling back to the static
 * defaults in site.ts for any field that hasn't been set yet (or if
 * no settings document exists at all). Safe to call from public pages
 * — this performs no auth check, unlike the admin write path.
 */
export async function getSiteSettings(): Promise<ResolvedSiteSettings> {
  await connectToDatabase();

  const settings = await SiteSettings.findById(SITE_SETTINGS_ID);

  if (!settings) {
    return {
      phone: siteConfig.phoneDisplay,
      email: siteConfig.email,
      whatsapp: siteConfig.whatsapp,
      addressLine1: siteConfig.address.line1,
      addressLine2: siteConfig.address.line2,
      city: siteConfig.address.city,
      country: siteConfig.address.country,
      operatingHours: siteConfig.operatingHours,
    };
  }

  return {
    phone: settings.phone || siteConfig.phoneDisplay,
    email: settings.email || siteConfig.email,
    whatsapp: settings.whatsapp || siteConfig.whatsapp,
    addressLine1: settings.addressLine1 || siteConfig.address.line1,
    addressLine2: settings.addressLine2 || siteConfig.address.line2,
    city: settings.city || siteConfig.address.city,
    country: settings.country || siteConfig.address.country,
    operatingHours: settings.operatingHours || siteConfig.operatingHours,
  };
}