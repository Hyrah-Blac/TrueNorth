import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";
import type { ContactFieldsInput } from "../CharterRequestForm";

interface DetailsContactStepProps {
  register: UseFormRegister<CreateQuoteInput>;
  errors: FieldErrors<CreateQuoteInput>;
  contactRegister: UseFormRegister<ContactFieldsInput>;
  contactErrors: FieldErrors<ContactFieldsInput>;
}

const TITLES = ["Mr.", "Mrs.", "Ms.", "Dr.", "Capt."];

// Small tracked-caps column label — the same eyebrow treatment used for
// field labels elsewhere on the site (see the Contact page's ContactRow),
// reused here so the two columns read as clearly organized sections
// rather than just two stacked lists of inputs.
function ColumnLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">{children}</p>;
}

/**
 * Step 2 of the charter request flow — a two-column layout mirroring the
 * VistaJet reference: contact fields on the left, a single freeform
 * "additional requests" box on the right. Mission type, aircraft
 * preference, budget range, and the equipment/VIP/cargo/pets/dangerous-
 * goods flags that used to have their own dedicated steps are no longer
 * collected as structured fields — the operations team gets that
 * context from whatever the customer writes in the notes box instead
 * (the schema's `specialRequests` field, unchanged), matching how
 * VistaJet's own flow collects it as free text rather than checkboxes.
 */
export function DetailsContactStep({ register, errors, contactRegister, contactErrors }: DetailsContactStepProps) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <ColumnLabel>Your Details</ColumnLabel>

        <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
          {/* Title/First/Last share one row from sm up — three short
              fields stacked full-width each reads as needless scroll
              once there's room for them side by side. */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <FormField label="Title" htmlFor="contactTitle" error={contactErrors.title?.message} className="sm:w-32 sm:shrink-0">
              <Select id="contactTitle" hasError={Boolean(contactErrors.title)} {...contactRegister("title")}>
                {TITLES.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="First name"
              htmlFor="contactFirstName"
              required
              error={contactErrors.firstName?.message}
              className="sm:flex-1"
            >
              <TextInput
                id="contactFirstName"
                hasError={Boolean(contactErrors.firstName)}
                {...contactRegister("firstName")}
              />
            </FormField>

            <FormField
              label="Last name"
              htmlFor="contactLastName"
              required
              error={contactErrors.lastName?.message}
              className="sm:flex-1"
            >
              <TextInput
                id="contactLastName"
                hasError={Boolean(contactErrors.lastName)}
                {...contactRegister("lastName")}
              />
            </FormField>
          </div>

          <FormField
            label="Email"
            htmlFor="contactInfo.email"
            required
            error={errors.contactInfo?.email?.message}
          >
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

          <FormField
            label="Company / Organization"
            htmlFor="contactInfo.company"
            hint="Optional"
            error={errors.contactInfo?.company?.message}
          >
            <TextInput id="contactInfo.company" {...register("contactInfo.company")} />
          </FormField>
        </div>
      </div>

      <div>
        <ColumnLabel>Tell Us More</ColumnLabel>

        <div className="mt-4 sm:mt-5">
          <label
            htmlFor="specialRequests"
            className="text-lg font-normal text-navy-900"
            style={{ fontFamily: '"Fraunces", "Iowan Old Style", "Georgia", serif' }}
          >
            Any additional requests that we may assist you with?
          </label>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            For example, aircraft preference, mission type, dietary requirements, special requests, or anything
            else our operations team should know about.
          </p>
          <Textarea
            id="specialRequests"
            rows={10}
            hasError={Boolean(errors.specialRequests)}
            className="mt-4"
            {...register("specialRequests")}
          />
          {errors.specialRequests ? (
            <p className="mt-1.5 text-xs text-red-600" role="alert">
              {errors.specialRequests.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}