import type { Metadata } from "next";
import { requireAdmin } from "@/middleware/admin";
import { SettingsForm } from "@/components/admin/forms/SettingsForm";
import { getSiteSettings } from "@/lib/config/siteSettings";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-soft">
      <p className="mb-7 text-sm text-slate-600">
        This contact information feeds the public site footer and contact page directly —
        changes here go live immediately.
      </p>
      <SettingsForm
        defaultValues={{
          phone: settings.phone,
          email: settings.email,
          whatsapp: settings.whatsapp ?? "",
          addressLine1: settings.addressLine1,
          addressLine2: settings.addressLine2 ?? "",
          city: settings.city,
          country: settings.country,
          operatingHours: settings.operatingHours,
        }}
      />
    </div>
  );
}
