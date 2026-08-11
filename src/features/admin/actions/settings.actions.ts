"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/database/connection";
import SiteSettings from "@/database/models/SiteSettings";
import { requireAdmin } from "@/middleware/admin";
import { resolveDbUserId } from "@/middleware/auth";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import { SITE_SETTINGS_ID, getSiteSettings, type ResolvedSiteSettings } from "@/lib/config/siteSettings";
import { siteSettingsSchema, type SiteSettingsInput } from "../schemas/settings.schema";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function updateSiteSettings(input: SiteSettingsInput): Promise<ActionResult<ResolvedSiteSettings>> {
  try {
    const session = await requireAdmin();
    const data = siteSettingsSchema.parse(input);

    // Normalize phone numbers — strip spaces and dashes that the schema
    // now validates via refine() rather than transform(), so normalization
    // happens here in the server action instead.
    const normalizePhone = (value?: string | null) =>
      value ? value.replace(/[\s-]/g, "") : value;

    await connectToDatabase();
    const updatedBy = await resolveDbUserId(session.clerkId);

    await SiteSettings.findByIdAndUpdate(
      SITE_SETTINGS_ID,
      {
        _id: SITE_SETTINGS_ID,
        phone: normalizePhone(data.phone),
        email: data.email,
        whatsapp: normalizePhone(data.whatsapp as string | undefined) || undefined,
        emergencyContact: normalizePhone(data.emergencyContact as string | undefined) || undefined,
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
        ai: {
          enabled: data.ai?.enabled ?? true,
          welcomeMessage: data.ai?.welcomeMessage || undefined,
          tone: data.ai?.tone || undefined,
          fallbackMessage: data.ai?.fallbackMessage || undefined,
          starterPrompts: data.ai?.starterPrompts ?? [],
          maxConversationLength: data.ai?.maxConversationLength || undefined,
        },
        updatedBy,
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // Every public page reading these settings needs to see the change.
    revalidatePath("/", "layout");

    // Reuse getSiteSettings()'s own default-resolution logic for the
    // response rather than re-deriving it here — one extra read on this
    // low-frequency admin action is a good trade for not duplicating
    // that logic in two places.
    return { success: true, data: await getSiteSettings() };
  } catch (error) {
    logger.error("updateSiteSettings failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to update settings" };
  }
}