import type { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
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
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-5">
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
        <FormField
          label="Departure date"
          htmlFor="departureDate"
          required
          error={errors.departureDate?.message}
        >
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
        ) : (
          <ToggleSwitch
            label="This is a round trip"
            description="We'll ask for a return date if enabled"
            {...register("isRoundTrip")}
          />
        )}
      </div>

      {isRoundTrip ? (
        <ToggleSwitch
          label="This is a round trip"
          description="We'll ask for a return date if enabled"
          {...register("isRoundTrip")}
        />
      ) : null}
    </div>
  );
}