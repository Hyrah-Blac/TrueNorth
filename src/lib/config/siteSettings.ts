import "server-only";
import connectToDatabase from "@/database/connection";
import SiteSettings from "@/database/models/SiteSettings";
import { siteConfig } from "./site";

// Fixed, known ObjectId so there is always exactly one settings
// document — reads and writes both target this same _id.
export const SITE_SETTINGS_ID = "000000000000000000000001";

export interface SocialLinkSetting {
  platform: string;
  href: string;
  label: string;
}

export interface ResolvedSiteSettings {
  // Contact
  phone: string;
  email: string;
  whatsapp?: string;
  emergencyContact?: string;
  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  // Identity
  companyName: string;
  companyShortName: string;
  companyDescription: string;
  companyTagline: string;
  // Operations
  operatingHours: string;
  // Social
  socialLinks: SocialLinkSetting[];
}

/**
 * Shape expected by the `contact` prop on email templates — a projection
 * of ResolvedSiteSettings including company name so emails render correctly.
 */
export function toEmailContact(settings: ResolvedSiteSettings) {
  return {
    companyName: settings.companyName,
    email: settings.email,
    addressLine1: settings.addressLine1,
    addressLine2: settings.addressLine2,
    city: settings.city,
    country: settings.country,
  };
}

/**
 * Returns admin-configured site settings, falling back to static
 * defaults in site.ts for any field not yet set. Safe to call from
 * public pages — no auth check.
 */
export async function getSiteSettings(): Promise<ResolvedSiteSettings> {
  await connectToDatabase();

  const settings = await SiteSettings.findById(SITE_SETTINGS_ID);

  if (!settings) {
    return {
      phone: siteConfig.phoneDisplay,
      email: siteConfig.email,
      whatsapp: siteConfig.whatsapp,
      emergencyContact: siteConfig.phoneDisplay,
      addressLine1: siteConfig.address.line1,
      addressLine2: siteConfig.address.line2,
      city: siteConfig.address.city,
      country: siteConfig.address.country,
      companyName: siteConfig.name,
      companyShortName: siteConfig.shortName,
      companyDescription: siteConfig.description,
      companyTagline: siteConfig.tagline,
      operatingHours: siteConfig.operatingHours,
      socialLinks: [],
    };
  }

  return {
    phone: settings.phone || siteConfig.phoneDisplay,
    email: settings.email || siteConfig.email,
    whatsapp: settings.whatsapp || siteConfig.whatsapp,
    emergencyContact: settings.emergencyContact || settings.phone || siteConfig.phoneDisplay,
    addressLine1: settings.addressLine1 || siteConfig.address.line1,
    addressLine2: settings.addressLine2 || siteConfig.address.line2,
    city: settings.city || siteConfig.address.city,
    country: settings.country || siteConfig.address.country,
    companyName: settings.companyName || siteConfig.name,
    companyShortName: settings.companyShortName || siteConfig.shortName,
    companyDescription: settings.companyDescription || siteConfig.description,
    companyTagline: settings.companyTagline || siteConfig.tagline,
    operatingHours: settings.operatingHours || siteConfig.operatingHours,
    socialLinks: settings.socialLinks ?? [],
  };
}
