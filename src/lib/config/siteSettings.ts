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

export interface ResolvedAiSettings {
  enabled: boolean;
  welcomeMessage: string;
  tone?: string;
  fallbackMessage: string;
  starterPrompts: string[];
  maxConversationLength: number;
}

// Matches the concierge's built-in behavior before any admin
// configuration exists — an admin who never opens this settings section
// sees exactly the same experience as today.
const DEFAULT_AI_SETTINGS: ResolvedAiSettings = {
  enabled: true,
  welcomeMessage: "How may I assist your journey?",
  tone: undefined,
  fallbackMessage:
    "I don't have that information right now — I can connect you with our operations team who can help directly.",
  starterPrompts: [
    "I need a flight from Nairobi to Mombasa.",
    "Recommend an aircraft for six passengers.",
    "Can pets travel onboard?",
    "What aircraft is best for safari flights?",
    "What destinations do you operate?",
  ],
  maxConversationLength: 60,
};

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
  // AI Concierge
  ai: ResolvedAiSettings;
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
      ai: DEFAULT_AI_SETTINGS,
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
    ai: {
      enabled: settings.ai?.enabled ?? DEFAULT_AI_SETTINGS.enabled,
      welcomeMessage: settings.ai?.welcomeMessage || DEFAULT_AI_SETTINGS.welcomeMessage,
      tone: settings.ai?.tone || DEFAULT_AI_SETTINGS.tone,
      fallbackMessage: settings.ai?.fallbackMessage || DEFAULT_AI_SETTINGS.fallbackMessage,
      starterPrompts:
        settings.ai?.starterPrompts && settings.ai.starterPrompts.length > 0
          ? settings.ai.starterPrompts
          : DEFAULT_AI_SETTINGS.starterPrompts,
      maxConversationLength: settings.ai?.maxConversationLength || DEFAULT_AI_SETTINGS.maxConversationLength,
    },
  };
}
