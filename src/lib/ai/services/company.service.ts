import "server-only";
import { getSiteSettings } from "@/lib/config/siteSettings";

export interface CompanyInfo {
  name: string;
  shortName: string;
  description: string;
  tagline: string;
  phone: string;
  email: string;
  whatsapp?: string;
  emergencyContact?: string;
  address: string;
  city: string;
  country: string;
  operatingHours: string;
}

/**
 * Resolves the current company information from the database-backed
 * site settings, with fallback to the static config. The result is
 * shaped for safe injection into AI prompts — no raw Mongoose objects.
 *
 * Accepts an optional pre-fetched `settings` object so callers that
 * already have one (e.g. buildSystemPrompt) don't trigger a second,
 * redundant getSiteSettings() call.
 */
export async function getCompanyInfoForAI(
  settings?: Awaited<ReturnType<typeof getSiteSettings>>
): Promise<CompanyInfo> {
  settings ??= await getSiteSettings();

  const addressParts = [settings.addressLine1, settings.addressLine2]
    .filter(Boolean)
    .join(", ");

  return {
    name: settings.companyName,
    shortName: settings.companyShortName || settings.companyName,
    description: settings.companyDescription,
    tagline: settings.companyTagline,
    phone: settings.phone,
    email: settings.email,
    whatsapp: settings.whatsapp,
    emergencyContact: settings.emergencyContact,
    address: addressParts,
    city: settings.city,
    country: settings.country,
    operatingHours: settings.operatingHours,
  };
}