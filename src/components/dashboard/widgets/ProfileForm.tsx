"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { Loader2, Save } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/buttons/Button";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { AvatarUploader } from "@/components/dashboard/widgets/AvatarUploader";
import { updateProfileSchema, type UpdateProfileFormValues } from "@/features/auth/schemas/user.schema";
import { updateOwnProfile } from "@/features/auth/actions/user.actions";

interface ProfileFormProps {
  defaultValues: UpdateProfileFormValues;
  initials: string;
  name: string;
}

export function ProfileForm({ defaultValues, initials, name }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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

      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
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

      <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
        <FormField label="First name" htmlFor="firstName" required error={errors.firstName?.message}>
          <TextInput id="firstName" hasError={Boolean(errors.firstName)} {...register("firstName")} />
        </FormField>
        <FormField label="Last name" htmlFor="lastName" required error={errors.lastName?.message}>
          <TextInput id="lastName" hasError={Boolean(errors.lastName)} {...register("lastName")} />
        </FormField>
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {saved ? <InlineAlert tone="success">Profile updated</InlineAlert> : null}

      <div className="flex justify-center sm:justify-end">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isPending}
          icon={isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}