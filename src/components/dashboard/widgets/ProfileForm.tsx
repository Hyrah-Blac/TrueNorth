"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { Loader2, Save, UserRound, ShieldCheck, Mail, CalendarDays, History } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/buttons/Button";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { AvatarUploader } from "@/components/dashboard/widgets/AvatarUploader";
import { updateProfileSchema, type UpdateProfileFormValues } from "@/features/auth/schemas/user.schema";
import { updateOwnProfile } from "@/features/auth/actions/user.actions";
import { formatRelativeTime } from "@/utils/date";

interface ProfileFormProps {
  defaultValues: UpdateProfileFormValues;
  initials: string;
  name: string;
  email: string;
  memberSince: string;
  updatedAt?: string;
}

/** Icon + title + one-line description — the same champagne "instrument"
 *  badge used for each row on the public Contact page (a small circular
 *  bg-champagne-50/text-champagne-600 chip around the icon, paired with
 *  an uppercase, letter-spaced label) now marks where one group of
 *  settings ends and the next begins, since there are no card boxes to
 *  do that visually. The description sits indented under the label so
 *  the badge reads as the section's anchor rather than a loose icon. */
function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne-50 text-champagne-600">
          <Icon className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</h2>
      </div>
      <p className="mt-2 pl-[1.875rem] text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

/** Read-only label/value row, used in the Account section — the same
 *  compact "instrument" shape as the Contact page's ContactRow (label +
 *  icon chip on one side, an editorial-serif value on the other), minus
 *  the tappable action button since nothing here is actionable. */
function InfoRow({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-navy-900/10 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne-50 text-champagne-600">
          <Icon className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">{label}</span>
      </div>
      <div className="pl-[1.875rem] sm:pl-0 sm:text-right">
        <p className="font-editorial truncate text-sm font-light leading-snug text-navy-900">{value}</p>
        {caption ? <p className="mt-0.5 text-[0.6875rem] text-slate-500">{caption}</p> : null}
      </div>
    </div>
  );
}

export function ProfileForm({ defaultValues, initials, name, email, memberSince, updatedAt }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(updatedAt);
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  // `defaultValues.company` is intentionally never registered or rendered
  // here (the Individual/Organization UI was removed) — react-hook-form
  // still carries unregistered defaultValues keys through untouched on
  // submit, so this doesn't clear a customer's existing company value.
  // Don't "clean up" this comment by adding a company field back without
  // checking — company still matters to admin views (customers list/detail).
  function onSubmit(data: UpdateProfileFormValues) {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateOwnProfile(data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Server action already pushed the new photo to Clerk (see
      // updateOwnProfile). reload() refetches this user's data from
      // Clerk and updates the shared client-side resource — MobileNav's
      // own useUser() call reads that same resource, so its account
      // panel picks up the new avatar immediately instead of waiting
      // for the next full page load.
      if (data.avatarPublicId) {
        await user?.reload();
      }

      setLastSavedAt(new Date().toISOString());
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <AvatarUploader
          initials={initials}
          currentUrl={defaultValues.avatarUrl || undefined}
          onUploaded={({ avatarUrl, avatarPublicId }) => {
            setValue("avatarUrl", avatarUrl, { shouldDirty: true });
            setValue("avatarPublicId", avatarPublicId, { shouldDirty: true });
          }}
        />
        <div className="min-w-0">
          <p className="truncate font-editorial text-2xl font-light tracking-tight text-navy-900 sm:text-3xl">
            {name}
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-champagne-600">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-champagne-500" aria-hidden="true" />
            Private charter account
          </span>
        </div>
      </div>

      <div className="horizon-divider" />

      <div>
        <SectionHeading
          icon={UserRound}
          title="Personal information"
          description="Used across your bookings, quotes, and flight manifests."
        />

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField label="First name" htmlFor="firstName" required error={errors.firstName?.message}>
              <TextInput id="firstName" hasError={Boolean(errors.firstName)} {...register("firstName")} />
            </FormField>
            <FormField label="Last name" htmlFor="lastName" required error={errors.lastName?.message}>
              <TextInput id="lastName" hasError={Boolean(errors.lastName)} {...register("lastName")} />
            </FormField>
          </div>

          <FormField
            label="Phone"
            htmlFor="phone"
            hint="Optional — e.g. +254 7XX XXX XXX"
            error={errors.phone?.message}
          >
            <TextInput id="phone" type="tel" numeric {...register("phone")} />
          </FormField>
        </div>
      </div>

      <div className="horizon-divider" />

      <div>
        <SectionHeading icon={ShieldCheck} title="Account" description="Managed through your sign-in provider." />

        <div>
          <InfoRow icon={Mail} label="Email" value={email} />
          <InfoRow icon={CalendarDays} label="Member since" value={memberSince} />
          {lastSavedAt ? (
            <InfoRow icon={History} label="Last updated" value={formatRelativeTime(lastSavedAt)} />
          ) : null}
        </div>
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {saved ? <InlineAlert tone="success">Profile updated</InlineAlert> : null}

      <div className="horizon-divider" />

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        >
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}