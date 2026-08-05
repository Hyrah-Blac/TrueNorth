"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Textarea } from "@/components/forms/Textarea";
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
    control,
    formState: { errors },
  } = useForm<SiteSettingsInput>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues,
  });

  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
    control,
    name: "socialLinks",
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
      {/* ── Company identity ────────────────────────────────────────── */}
      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Company identity</p>

        <FormField label="Company Name" htmlFor="companyName" required error={errors.companyName?.message}>
          <TextInput id="companyName" hasError={Boolean(errors.companyName)} {...register("companyName")} />
        </FormField>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Short Name" htmlFor="companyShortName" hint="Used in abbreviated contexts" error={errors.companyShortName?.message}>
            <TextInput id="companyShortName" {...register("companyShortName")} />
          </FormField>
          <FormField label="Tagline" htmlFor="companyTagline" error={errors.companyTagline?.message}>
            <TextInput id="companyTagline" {...register("companyTagline")} />
          </FormField>
        </div>

        <FormField label="Company Description" htmlFor="companyDescription" hint="Shown on About page hero and in structured data (max 500 chars)" error={errors.companyDescription?.message}>
          <Textarea id="companyDescription" rows={3} {...register("companyDescription")} />
        </FormField>
      </div>

      {/* ── Contact ─────────────────────────────────────────────────── */}
      <div className="space-y-5 border-t border-slate-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contact</p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Phone" htmlFor="phone" required error={errors.phone?.message}>
            <TextInput id="phone" hasError={Boolean(errors.phone)} {...register("phone")} />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <TextInput id="email" type="email" hasError={Boolean(errors.email)} {...register("email")} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="WhatsApp" htmlFor="whatsapp" hint="Optional — digits with country code" error={errors.whatsapp?.message}>
            <TextInput id="whatsapp" {...register("whatsapp")} />
          </FormField>
          <FormField label="Emergency Contact" htmlFor="emergencyContact" hint="Shown on contact page under Emergency" error={errors.emergencyContact?.message}>
            <TextInput id="emergencyContact" {...register("emergencyContact")} />
          </FormField>
        </div>
      </div>

      {/* ── Address ─────────────────────────────────────────────────── */}
      <div className="space-y-5 border-t border-slate-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Address</p>

        <FormField label="Address line 1" htmlFor="addressLine1" required error={errors.addressLine1?.message}>
          <TextInput id="addressLine1" hasError={Boolean(errors.addressLine1)} {...register("addressLine1")} />
        </FormField>

        <FormField label="Address line 2" htmlFor="addressLine2" hint="Optional">
          <TextInput id="addressLine2" {...register("addressLine2")} />
        </FormField>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="City" htmlFor="city" required error={errors.city?.message}>
            <TextInput id="city" hasError={Boolean(errors.city)} {...register("city")} />
          </FormField>
          <FormField label="Country" htmlFor="country" required error={errors.country?.message}>
            <TextInput id="country" hasError={Boolean(errors.country)} {...register("country")} />
          </FormField>
        </div>
      </div>

      {/* ── Operations ──────────────────────────────────────────────── */}
      <div className="space-y-5 border-t border-slate-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Operations</p>

        <FormField label="Operating hours" htmlFor="operatingHours" required hint="Displayed on the Contact page" error={errors.operatingHours?.message}>
          <TextInput id="operatingHours" hasError={Boolean(errors.operatingHours)} {...register("operatingHours")} />
        </FormField>
      </div>

      {/* ── Social links ────────────────────────────────────────────── */}
      <div className="space-y-5 border-t border-slate-100 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Social links</p>
          <button
            type="button"
            onClick={() => appendSocial({ platform: "", href: "", label: "" })}
            className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add link
          </button>
        </div>

        {socialFields.length === 0 ? (
          <p className="text-xs text-slate-400">No social links configured. Click &ldquo;Add link&rdquo; to add one.</p>
        ) : (
          <div className="space-y-4">
            {socialFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid flex-1 grid-cols-3 gap-3">
                  <FormField
                    label="Platform"
                    htmlFor={`socialLinks.${index}.platform`}
                    hint="e.g. linkedin, instagram"
                    error={errors.socialLinks?.[index]?.platform?.message}
                  >
                    <TextInput
                      id={`socialLinks.${index}.platform`}
                      {...register(`socialLinks.${index}.platform`)}
                    />
                  </FormField>
                  <FormField
                    label="Label"
                    htmlFor={`socialLinks.${index}.label`}
                    hint="e.g. LinkedIn"
                    error={errors.socialLinks?.[index]?.label?.message}
                  >
                    <TextInput
                      id={`socialLinks.${index}.label`}
                      {...register(`socialLinks.${index}.label`)}
                    />
                  </FormField>
                  <FormField
                    label="URL"
                    htmlFor={`socialLinks.${index}.href`}
                    hint="Full URL"
                    error={errors.socialLinks?.[index]?.href?.message}
                  >
                    <TextInput
                      id={`socialLinks.${index}.href`}
                      type="url"
                      {...register(`socialLinks.${index}.href`)}
                    />
                  </FormField>
                </div>
                <button
                  type="button"
                  onClick={() => removeSocial(index)}
                  className="mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove social link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── AI Concierge ────────────────────────────────────────────── */}
      <div className="space-y-5 border-t border-slate-100 pt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">AI Concierge</p>

        <Controller
          control={control}
          name="ai.enabled"
          render={({ field }) => (
            <label className="flex items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={field.value ?? true}
                onChange={(event) => field.onChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              Enable the AI Concierge on the public site
            </label>
          )}
        />

        <FormField
          label="Welcome message"
          htmlFor="ai.welcomeMessage"
          hint="Shown as the concierge panel's opening heading"
          error={errors.ai?.welcomeMessage?.message}
        >
          <TextInput id="ai.welcomeMessage" {...register("ai.welcomeMessage")} />
        </FormField>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label="Tone"
            htmlFor="ai.tone"
            hint="Optional — e.g. 'warm and formal', 'brisk and efficient'"
            error={errors.ai?.tone?.message}
          >
            <TextInput id="ai.tone" {...register("ai.tone")} />
          </FormField>
          <FormField
            label="Max conversation length"
            htmlFor="ai.maxConversationLength"
            hint="Messages before the concierge asks to start fresh"
            error={errors.ai?.maxConversationLength?.message}
          >
            <TextInput id="ai.maxConversationLength" type="number" min={5} max={500} {...register("ai.maxConversationLength")} />
          </FormField>
        </div>

        <FormField
          label="Fallback message"
          htmlFor="ai.fallbackMessage"
          hint="Used when the concierge genuinely doesn't know something"
          error={errors.ai?.fallbackMessage?.message}
        >
          <Textarea id="ai.fallbackMessage" rows={2} {...register("ai.fallbackMessage")} />
        </FormField>

        <Controller
          control={control}
          name="ai.starterPrompts"
          render={({ field }) => (
            <FormField
              label="Starter prompts"
              htmlFor="ai.starterPrompts"
              hint="One per line — shown as suggested questions on the welcome screen (max 6)"
              error={errors.ai?.starterPrompts?.message}
            >
              <Textarea
                id="ai.starterPrompts"
                rows={5}
                value={(field.value ?? []).join("\n")}
                onChange={(event) =>
                  field.onChange(
                    event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .slice(0, 6)
                  )
                }
              />
            </FormField>
          )}
        />
      </div>

      {/* ── Submit ──────────────────────────────────────────────────── */}
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
