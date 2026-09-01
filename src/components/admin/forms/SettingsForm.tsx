"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Buildings, Phone, MapPin, ShareNetwork, Robot, Wrench } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Textarea } from "@/components/forms/Textarea";
import { FancyButton } from "@/components/shared/buttons/FancyButton";
import { updateSiteSettings } from "@/features/admin/actions/settings.actions";
import { siteSettingsSchema, type SiteSettingsInput } from "@/features/admin/schemas/settings.schema";

// Each settings group renders as its own card with an icon + title
// header, laid out in a responsive grid on the page (see
// admin/settings/page.tsx) instead of one long column of dividers — the
// old layout left the whole right side of the page empty above ~1024px.
// Matches the premium card treatment used on the dashboard overview:
// generous rounding, a hairline border, and a soft shadow so it reads as
// a gently raised surface rather than a flat, boxed-in panel.
function SectionCard({
  title,
  description,
  icon: Icon,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  icon: PhosphorIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-7 shadow-sm sm:p-8 ${className}`}
      style={{ border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div className="mb-7 flex items-start gap-4 border-b border-slate-100 pb-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-950/5 text-navy-900">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-editorial text-xl font-light text-navy-900">{title}</h2>
          {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ── Company identity ──────────────────────────────────────── */}
        <SectionCard
          title="Company Identity"
          description="Name and description shown across the public site"
          icon={Buildings}
          className="lg:col-span-2"
        >
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
        </SectionCard>

        {/* ── Contact ────────────────────────────────────────────────── */}
        <SectionCard title="Contact" description="How customers and the concierge reach your team" icon={Phone}>
          <FormField label="Phone" htmlFor="phone" required error={errors.phone?.message}>
            <TextInput id="phone" type="tel" numeric hasError={Boolean(errors.phone)} {...register("phone")} />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <TextInput id="email" type="email" hasError={Boolean(errors.email)} {...register("email")} />
          </FormField>
          <FormField label="WhatsApp" htmlFor="whatsapp" hint="Optional — digits with country code" error={errors.whatsapp?.message}>
            <TextInput id="whatsapp" type="tel" numeric {...register("whatsapp")} />
          </FormField>
          <FormField label="Emergency Contact" htmlFor="emergencyContact" hint="Shown on contact page under Emergency" error={errors.emergencyContact?.message}>
            <TextInput id="emergencyContact" type="tel" numeric {...register("emergencyContact")} />
          </FormField>
        </SectionCard>

        {/* ── Address & operations ──────────────────────────────────── */}
        <SectionCard title="Address & Hours" description="Where you're based and when you're reachable" icon={MapPin}>
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

          <FormField label="Operating hours" htmlFor="operatingHours" required hint="Displayed on the Contact page" error={errors.operatingHours?.message}>
            <TextInput id="operatingHours" hasError={Boolean(errors.operatingHours)} {...register("operatingHours")} />
          </FormField>
        </SectionCard>

        {/* ── Social links ───────────────────────────────────────────── */}
        <SectionCard
          title="Social Links"
          description="Shown in the site footer and structured data"
          icon={ShareNetwork}
          className="lg:col-span-2"
        >
          <div className="flex justify-end">
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
                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
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
        </SectionCard>

        {/* ── AI Concierge ───────────────────────────────────────────── */}
        <SectionCard
          title="AI Concierge"
          description="Behaviour of the chat concierge on the public site"
          icon={Robot}
          className="lg:col-span-2"
        >
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
        </SectionCard>

        {/* ── Maintenance Mode ──────────────────────────────────────── */}
        <SectionCard
          title="Maintenance Mode"
          description="Take the public site offline for visitors while you work"
          icon={Wrench}
          className="lg:col-span-2"
        >
          <Controller
            control={control}
            name="maintenanceMode.enabled"
            render={({ field }) => (
              <label className="flex items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={field.value ?? false}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Show visitors a maintenance page instead of the site
              </label>
            )}
          />

          <p className="text-xs text-slate-500">
            Takes effect within about 10 seconds of saving. The admin panel and sign-in stay
            reachable so you can turn this back off from here.
          </p>

          <FormField
            label="Message"
            htmlFor="maintenanceMode.message"
            hint="Optional — shown on the maintenance page. Leave blank for the default message."
            error={errors.maintenanceMode?.message?.message}
          >
            <Textarea id="maintenanceMode.message" rows={2} {...register("maintenanceMode.message")} />
          </FormField>
        </SectionCard>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────
          Static — sits at the natural bottom of the page after the last
          card, rather than pinned/sticky over the content while
          scrolling. A top divider is enough to separate it from the
          cards above. */}
      <div className="flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {saved ? (
            <p className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Settings updated — changes are live on the site now.
            </p>
          ) : null}
          {!error && !saved ? (
            <p className="text-xs text-slate-400">Changes save immediately to the live site.</p>
          ) : null}
        </div>

        {/* Bespoke save CTA — see FancyButton for why this isn't the
            shared pill <Button> used for ordinary actions elsewhere. */}
        <FancyButton
          type="submit"
          disabled={isPending}
          className="self-start sm:self-auto"
          icon={
            isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
            )
          }
        >
          {isPending ? "Saving…" : "Save Changes"}
        </FancyButton>
      </div>
    </form>
  );
}