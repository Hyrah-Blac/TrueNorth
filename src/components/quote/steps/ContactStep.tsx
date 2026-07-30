import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";

interface ContactStepProps {
  register: UseFormRegister<CreateQuoteInput>;
  errors: FieldErrors<CreateQuoteInput>;
}

export function ContactStep({ register, errors }: ContactStepProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <FormField
        label="Full name"
        htmlFor="contactInfo.fullName"
        required
        error={errors.contactInfo?.fullName?.message}
      >
        <TextInput
          id="contactInfo.fullName"
          hasError={Boolean(errors.contactInfo?.fullName)}
          {...register("contactInfo.fullName")}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <FormField label="Email" htmlFor="contactInfo.email" required error={errors.contactInfo?.email?.message}>
          <TextInput
            id="contactInfo.email"
            type="email"
            hasError={Boolean(errors.contactInfo?.email)}
            {...register("contactInfo.email")}
          />
        </FormField>

        <FormField
          label="Phone"
          htmlFor="contactInfo.phone"
          required
          hint="e.g. +254 7XX XXX XXX"
          error={errors.contactInfo?.phone?.message}
        >
          <TextInput
            id="contactInfo.phone"
            type="tel"
            hasError={Boolean(errors.contactInfo?.phone)}
            {...register("contactInfo.phone")}
          />
        </FormField>
      </div>

      <FormField
        label="Company / Organization"
        htmlFor="contactInfo.company"
        hint="Optional"
        error={errors.contactInfo?.company?.message}
      >
        <TextInput id="contactInfo.company" {...register("contactInfo.company")} />
      </FormField>
    </div>
  );
}