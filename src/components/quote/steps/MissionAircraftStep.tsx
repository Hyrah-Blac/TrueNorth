import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { SelectMenu } from "@/components/forms/SelectMenu";
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
  watch: UseFormWatch<CreateQuoteInput>;
  setValue: UseFormSetValue<CreateQuoteInput>;
  aircraftOptions: AircraftOption[];
}

export function MissionAircraftStep({ register, errors, watch, setValue, aircraftOptions }: MissionAircraftStepProps) {
  const missionType = watch("missionType");
  const aircraftPreference = watch("aircraftPreference");

  return (
    <div className="space-y-4 sm:space-y-5">
      <SelectMenu
        id="missionType"
        label="Mission type"
        required
        error={errors.missionType?.message}
        value={missionType ?? ""}
        onChange={(value) => setValue("missionType", value as MissionType, { shouldValidate: true })}
        options={MISSION_TYPE_VALUES.map((mission: MissionType) => ({
          value: mission,
          label: MISSION_TYPE_LABELS[mission],
        }))}
      />

      <div>
        <SelectMenu
          id="aircraftPreference"
          label="Preferred aircraft"
          error={errors.aircraftPreference?.message}
          value={aircraftPreference ?? ""}
          onChange={(value) => setValue("aircraftPreference", value || undefined, { shouldValidate: true })}
          options={[
            { value: "", label: "No preference — recommend for me" },
            ...aircraftOptions.map((aircraft) => ({ value: aircraft._id, label: aircraft.name })),
          ]}
        />
        {!errors.aircraftPreference ? (
          <p className="mt-1.5 text-xs text-slate-500">Optional — leave blank and we&rsquo;ll recommend the best fit</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
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