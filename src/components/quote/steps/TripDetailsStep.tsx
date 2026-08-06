import type { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { ArrowLeftRight } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Select } from "@/components/forms/Select";
import { ToggleSwitch } from "@/components/forms/ToggleSwitch";
import { airports } from "@/content/airports";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";

interface TripDetailsStepProps {
  register: UseFormRegister<CreateQuoteInput>;
  errors: FieldErrors<CreateQuoteInput>;
  watch: UseFormWatch<CreateQuoteInput>;
}

export function TripDetailsStep({ register, errors, watch }: TripDetailsStepProps) {
  const isRoundTrip = watch("isRoundTrip");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-editorial text-lg font-light text-navy-900 sm:text-xl">Trip details</h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Where and when you&apos;d like to fly.</p>
      </div>

      <FormField label="Passenger count" htmlFor="passengerCount" required error={errors.passengerCount?.message}>
        <TextInput
          id="passengerCount"
          type="number"
          min={1}
          max={100}
          hasError={Boolean(errors.passengerCount)}
          {...register("passengerCount", { valueAsNumber: true })}
        />
      </FormField>

      <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <FormField
          label="Departure airport"
          htmlFor="departureAirportCode"
          required
          error={errors.departureAirportCode?.message}
        >
          <Select
            id="departureAirportCode"
            hasError={Boolean(errors.departureAirportCode)}
            defaultValue=""
            {...register("departureAirportCode")}
          >
            <option value="" disabled>
              Select airport
            </option>
            {airports.map((airport) => (
              <option key={airport.code} value={airport.code}>
                {airport.name} ({airport.code})
              </option>
            ))}
          </Select>
        </FormField>

        <span
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-crisp sm:flex"
          aria-hidden="true"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </span>

        <FormField
          label="Destination airport"
          htmlFor="destinationAirportCode"
          required
          error={errors.destinationAirportCode?.message}
        >
          <Select
            id="destinationAirportCode"
            hasError={Boolean(errors.destinationAirportCode)}
            defaultValue=""
            {...register("destinationAirportCode")}
          >
            <option value="" disabled>
              Select airport
            </option>
            {airports.map((airport) => (
              <option key={airport.code} value={airport.code}>
                {airport.name} ({airport.code})
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <FormField label="Departure date" htmlFor="departureDate" required error={errors.departureDate?.message}>
          <TextInput
            id="departureDate"
            type="date"
            min={today}
            hasError={Boolean(errors.departureDate)}
            {...register("departureDate")}
          />
        </FormField>

        {isRoundTrip ? (
          <FormField label="Return date" htmlFor="returnDate" required error={errors.returnDate?.message}>
            <TextInput
              id="returnDate"
              type="date"
              min={today}
              hasError={Boolean(errors.returnDate)}
              {...register("returnDate", {
                setValueAs: (value) => (value === "" ? undefined : value),
              })}
            />
          </FormField>
        ) : null}
      </div>

      <div
        className={`rounded-lg border p-4 transition-colors duration-300 sm:p-5 ${
          isRoundTrip ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-slate-50"
        }`}
      >
        <ToggleSwitch
          label="This is a round trip"
          description="We'll ask for a return date if enabled"
          {...register("isRoundTrip")}
        />
      </div>
    </div>
  );
}