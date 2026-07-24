"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/buttons/Button";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { updateProfileSchema, type UpdateProfileFormValues } from "@/features/auth/schemas/user.schema";
import { updateOwnProfile } from "@/features/auth/actions/user.actions";

export function ProfileForm({ defaultValues }: { defaultValues: UpdateProfileFormValues }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  function onSubmit(data: UpdateProfileFormValues) {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateOwnProfile(data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="First name" htmlFor="firstName" required error={errors.firstName?.message}>
          <TextInput id="firstName" hasError={Boolean(errors.firstName)} {...register("firstName")} />
        </FormField>
        <FormField label="Last name" htmlFor="lastName" required error={errors.lastName?.message}>
          <TextInput id="lastName" hasError={Boolean(errors.lastName)} {...register("lastName")} />
        </FormField>
      </div>

      <FormField label="Phone" htmlFor="phone" hint="Optional — e.g. +254 7XX XXX XXX" error={errors.phone?.message}>
        <TextInput id="phone" type="tel" {...register("phone")} />
      </FormField>

      <FormField label="Company / Organization" htmlFor="company" hint="Optional" error={errors.company?.message}>
        <TextInput id="company" {...register("company")} />
      </FormField>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {saved ? <InlineAlert tone="success">Profile updated</InlineAlert> : null}

      <Button
        type="submit"
        variant="primary"
        disabled={isPending}
        icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      >
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
