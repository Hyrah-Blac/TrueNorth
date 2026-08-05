import type { Metadata } from "next";
import { requireAdmin } from "@/middleware/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsForm } from "@/components/admin/forms/SettingsForm";
import { getSiteSettings } from "@/lib/config/siteSettings";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="All public-facing company information is sourced from here. Changes are live immediately."
      />

      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-soft">
        <SettingsForm
          defaultValues={{
            companyName: settings.companyName,
            companyShortName: settings.companyShortName ?? "",
            companyDescription: settings.companyDescription ?? "",
            companyTagline: settings.companyTagline ?? "",
            phone: settings.phone,
            email: settings.email,
            whatsapp: settings.whatsapp ?? "",
            emergencyContact: settings.emergencyContact ?? "",
            addressLine1: settings.addressLine1,
            addressLine2: settings.addressLine2 ?? "",
            city: settings.city,
            country: settings.country,
            operatingHours: settings.operatingHours,
            socialLinks: settings.socialLinks ?? [],
            ai: {
              enabled: settings.ai.enabled,
              welcomeMessage: settings.ai.welcomeMessage,
              tone: settings.ai.tone ?? "",
              fallbackMessage: settings.ai.fallbackMessage,
              starterPrompts: settings.ai.starterPrompts,
              maxConversationLength: settings.ai.maxConversationLength,
            },
          }}
        />
      </div>
    </div>
  );
}
