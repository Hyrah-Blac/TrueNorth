import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { AirportCombobox } from "@/components/forms/AirportCombobox";
import { ToggleSwitch } from "@/components/forms/ToggleSwitch";
import { airports } from "@/content/airports";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";

interface TripDetailsStepProps {
  register: UseFormRegister<CreateQuoteInput>;
  errors: FieldErrors<CreateQuoteInput>;
  watch: UseFormWatch<CreateQuoteInput>;
  setValue: UseFormSetValue<CreateQuoteInput>;
}

export function TripDetailsStep({ register, errors, watch, setValue }: TripDetailsStepProps) {
  const isRoundTrip = watch("isRoundTrip");
  const departureAirportCode = watch("departureAirportCode");
  const destinationAirportCode = watch("destinationAirportCode");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <AirportCombobox
          id="departureAirportCode"
          label="Departure airport"
          required
          error={errors.departureAirportCode?.message}
          airports={airports}
          value={departureAirportCode ?? ""}
          onChange={(code) => setValue("departureAirportCode", code, { shouldValidate: true })}
          hasError={Boolean(errors.departureAirportCode)}
        />

        <AirportCombobox
          id="destinationAirportCode"
          label="Destination airport"
          required
          error={errors.destinationAirportCode?.message}
          airports={airports}
          value={destinationAirportCode ?? ""}
          onChange={(code) => setValue("destinationAirportCode", code, { shouldValidate: true })}
          hasError={Boolean(errors.destinationAirportCode)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
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

        <FormField label="Departure date" htmlFor="departureDate" required error={errors.departureDate?.message}>
          <TextInput
            id="departureDate"
            type="date"
            min={today}
            hasError={Boolean(errors.departureDate)}
            {...register("departureDate")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
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
        <ToggleSwitch
          label="This is a round trip"
          description="We'll ask for a return date if enabled"
          {...register("isRoundTrip")}
        />
      </div>
    </div>
  );
}