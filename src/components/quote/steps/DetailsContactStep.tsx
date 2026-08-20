import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { PlainField, PlainInput, PlainSelect, PlainTextarea, PhoneField } from "./PlainFields";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";
import type { ContactFieldsInput } from "../CharterRequestForm";

interface DetailsContactStepProps {
  register: UseFormRegister<CreateQuoteInput>;
  errors: FieldErrors<CreateQuoteInput>;
  contactRegister: UseFormRegister<ContactFieldsInput>;
  contactErrors: FieldErrors<ContactFieldsInput>;
  phoneValue: string;
  onPhoneChange: (value: string) => void;
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
export function DetailsContactStep({
  register,
  errors,
  contactRegister,
  contactErrors,
  phoneValue,
  onPhoneChange,
}: DetailsContactStepProps) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      <div>
        <ColumnLabel>Your Details</ColumnLabel>

        <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
          <PlainField label="Title" htmlFor="contactTitle" error={contactErrors.title?.message}>
            <PlainSelect id="contactTitle" hasError={Boolean(contactErrors.title)} {...contactRegister("title")}>
              {TITLES.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </PlainSelect>
          </PlainField>

          <PlainField
            label="First name"
            htmlFor="contactFirstName"
            required
            error={contactErrors.firstName?.message}
          >
            <PlainInput
              id="contactFirstName"
              hasError={Boolean(contactErrors.firstName)}
              {...contactRegister("firstName")}
            />
          </PlainField>

          <PlainField label="Last name" htmlFor="contactLastName" required error={contactErrors.lastName?.message}>
            <PlainInput
              id="contactLastName"
              hasError={Boolean(contactErrors.lastName)}
              {...contactRegister("lastName")}
            />
          </PlainField>

          <PlainField
            label="Email"
            htmlFor="contactInfo.email"
            required
            error={errors.contactInfo?.email?.message}
          >
            <PlainInput
              id="contactInfo.email"
              type="email"
              hasError={Boolean(errors.contactInfo?.email)}
              {...register("contactInfo.email")}
            />
          </PlainField>

          <PlainField
            label="Phone"
            htmlFor="contactInfo.phone"
            required
            error={errors.contactInfo?.phone?.message}
          >
            <PhoneField
              id="contactInfo.phone"
              value={phoneValue}
              onValueChange={onPhoneChange}
              hasError={Boolean(errors.contactInfo?.phone)}
            />
          </PlainField>
        </div>
      </div>

      <div>
        <ColumnLabel>Tell Us More</ColumnLabel>

        <div className="mt-4 sm:mt-5">
          <label htmlFor="specialRequests" className="text-sm font-semibold text-navy-900">
            Any additional requests that we may assist you with?
          </label>
          <p className="mt-1.5 text-xs leading-relaxed text-champagne-600">
            Perhaps you&apos;re travelling with pets, need cargo handling, VIP arrangements, or specialist equipment
            onboard.
          </p>
          <PlainTextarea
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