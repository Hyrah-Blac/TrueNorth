"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { Loader2, Save, UserRound, ShieldCheck } from "lucide-react";
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

/** Icon + title + one-line description — the only thing that now marks
 *  where one group of settings ends and the next begins, since there
 *  are no card boxes to do that visually. Title uses the same small
 *  uppercase label style as the quote detail page's section headers
 *  ("TRIP DETAILS", "SPECIAL REQUIREMENTS") for a consistent hierarchy
 *  across the portal. */
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
    <div className="mb-6 flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

/** Read-only label/value row, used in the Account section. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="truncate text-sm font-medium text-navy-900">{value}</dd>
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
          <p className="mt-1 text-sm text-slate-500">Private charter account</p>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-7">
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
            <TextInput id="phone" type="tel" {...register("phone")} />
          </FormField>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-7">
        <SectionHeading icon={ShieldCheck} title="Account" description="Managed through your sign-in provider." />

        <dl className="divide-y divide-slate-100">
          <InfoRow label="Email" value={email} />
          <InfoRow label="Member since" value={memberSince} />
          {lastSavedAt ? <InfoRow label="Last updated" value={formatRelativeTime(lastSavedAt)} /> : null}
        </dl>
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {saved ? <InlineAlert tone="success">Profile updated</InlineAlert> : null}

      <div className="flex justify-end border-t border-slate-200 pt-7">
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