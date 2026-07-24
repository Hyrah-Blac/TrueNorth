import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Select } from "@/components/forms/Select";
import { MISSION_TYPE_LABELS, MISSION_TYPE_VALUES } from "@/database/constants/mission-type";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";
import type { MissionType } from "@/database/constants/mission-type";

export interface AircraftOption {
  _id: string;
  name: string;
  category: string;
}

interface MissionAircraftStepProps {
  register: UseFormRegister<CreateQuoteInput>;
  errors: FieldErrors<CreateQuoteInput>;
  aircraftOptions: AircraftOption[];
}

export function MissionAircraftStep({ register, errors, aircraftOptions }: MissionAircraftStepProps) {
  return (
    <div className="space-y-6">
      <FormField label="Mission type" htmlFor="missionType" required error={errors.missionType?.message}>
        <Select id="missionType" hasError={Boolean(errors.missionType)} defaultValue="" {...register("missionType")}>
          <option value="" disabled>
            Select mission type
          </option>
          {MISSION_TYPE_VALUES.map((mission: MissionType) => (
            <option key={mission} value={mission}>
              {MISSION_TYPE_LABELS[mission]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="Preferred aircraft"
        htmlFor="aircraftPreference"
        hint="Optional — leave blank and we'll recommend the best fit"
        error={errors.aircraftPreference?.message}
      >
        <Select
          id="aircraftPreference"
          defaultValue=""
          {...register("aircraftPreference", {
            setValueAs: (value) => (value === "" ? undefined : value),
          })}
        >
          <option value="">No preference — recommend for me</option>
          {aircraftOptions.map((aircraft) => (
            <option key={aircraft._id} value={aircraft._id}>
              {aircraft.name}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          label="Budget minimum (KES)"
          htmlFor="budgetRangeMin"
          hint="Optional — e.g. 300000"
          error={errors.budgetRangeMin?.message}
        >
          <TextInput
            id="budgetRangeMin"
            type="number"
            min={0}
            {...register("budgetRangeMin", {
              setValueAs: (value) => (value === "" || value === undefined ? undefined : Number(value)),
            })}
          />
        </FormField>

        <FormField
          label="Budget maximum (KES)"
          htmlFor="budgetRangeMax"
          hint="Optional — e.g. 600000"
          error={errors.budgetRangeMax?.message}
        >
          <TextInput
            id="budgetRangeMax"
            type="number"
            min={0}
            {...register("budgetRangeMax", {
              setValueAs: (value) => (value === "" || value === undefined ? undefined : Number(value)),
            })}
          />
        </FormField>
      </div>
    </div>
  );
}
