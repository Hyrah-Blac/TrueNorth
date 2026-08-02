"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/database/connection";
import SiteSettings from "@/database/models/SiteSettings";
import { requireAdmin } from "@/middleware/admin";
import { resolveDbUserId } from "@/middleware/auth";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { SITE_SETTINGS_ID, type ResolvedSiteSettings } from "@/lib/config/siteSettings";
import { siteSettingsSchema, type SiteSettingsInput } from "../schemas/settings.schema";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function updateSiteSettings(input: SiteSettingsInput): Promise<ActionResult<ResolvedSiteSettings>> {
  try {
    const session = await requireAdmin();
    const data = siteSettingsSchema.parse(input);

    await connectToDatabase();
    const updatedBy = await resolveDbUserId(session.clerkId);

    const settings = await SiteSettings.findByIdAndUpdate(
      SITE_SETTINGS_ID,
      {
        _id: SITE_SETTINGS_ID,
        phone: data.phone,
        email: data.email,
        whatsapp: data.whatsapp || undefined,
        emergencyContact: data.emergencyContact || undefined,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city,
        country: data.country,
        companyName: data.companyName,
        companyShortName: data.companyShortName || undefined,
        companyDescription: data.companyDescription || undefined,
        companyTagline: data.companyTagline || undefined,
        operatingHours: data.operatingHours,
        socialLinks: data.socialLinks ?? [],
        updatedBy,
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // Every public page reading these settings needs to see the change.
    revalidatePath("/", "layout");

    return {
      success: true,
      data: {
        phone: settings.phone,
        email: settings.email,
        whatsapp: settings.whatsapp,
        emergencyContact: settings.emergencyContact,
        addressLine1: settings.addressLine1,
        addressLine2: settings.addressLine2,
        city: settings.city,
        country: settings.country,
        companyName: settings.companyName,
        companyShortName: settings.companyShortName ?? "",
        companyDescription: settings.companyDescription ?? "",
        companyTagline: settings.companyTagline ?? "",
        operatingHours: settings.operatingHours,
        socialLinks: settings.socialLinks ?? [],
      },
    };
  } catch (error) {
    logger.error("updateSiteSettings failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to update settings" };
  }
}
