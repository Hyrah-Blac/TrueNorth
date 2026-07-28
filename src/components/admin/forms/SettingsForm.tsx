"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/buttons/Button";
import { updateSiteSettings } from "@/features/admin/actions/settings.actions";
import { siteSettingsSchema, type SiteSettingsInput } from "@/features/admin/schemas/settings.schema";
export function SettingsForm({ defaultValues }: { defaultValues: SiteSettingsInput }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SiteSettingsInput>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues,
  });

  function onSubmit(data: SiteSettingsInput) {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateSiteSettings(data);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="Phone" htmlFor="phone" required error={errors.phone?.message}>
          <TextInput id="phone" hasError={Boolean(errors.phone)} {...register("phone")} />
        </FormField>
        <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
          <TextInput id="email" type="email" hasError={Boolean(errors.email)} {...register("email")} />
        </FormField>
      </div>

      <FormField label="WhatsApp" htmlFor="whatsapp" hint="Optional" error={errors.whatsapp?.message}>
        <TextInput id="whatsapp" {...register("whatsapp")} />
      </FormField>

      <FormField label="Address line 1" htmlFor="addressLine1" required error={errors.addressLine1?.message}>
        <TextInput id="addressLine1" hasError={Boolean(errors.addressLine1)} {...register("addressLine1")} />
      </FormField>

      <FormField label="Address line 2" htmlFor="addressLine2" hint="Optional">
        <TextInput id="addressLine2" {...register("addressLine2")} />
      </FormField>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="City" htmlFor="city" required error={errors.city?.message}>
          <TextInput id="city" hasError={Boolean(errors.city)} {...register("city")} />
        </FormField>
        <FormField label="Country" htmlFor="country" required error={errors.country?.message}>
          <TextInput id="country" hasError={Boolean(errors.country)} {...register("country")} />
        </FormField>
      </div>

      <FormField label="Operating hours" htmlFor="operatingHours" required error={errors.operatingHours?.message}>
        <TextInput id="operatingHours" hasError={Boolean(errors.operatingHours)} {...register("operatingHours")} />
      </FormField>

      {error ? <p className="rounded-md bg-red-50 px-4 py-3.5 text-sm text-red-700">{error}</p> : null}
      {saved ? (
        <p className="flex items-center gap-2 rounded-md bg-green-50 px-4 py-3.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Settings updated — changes are live on the site now.
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        disabled={isPending}
        icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      >
        {isPending ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
