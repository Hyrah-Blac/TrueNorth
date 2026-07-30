import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/forms/Textarea";
import { ToggleSwitch } from "@/components/forms/ToggleSwitch";
import { DocumentUploader } from "@/components/forms/DocumentUploader";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";

interface RequirementsStepProps {
  register: UseFormRegister<CreateQuoteInput>;
  errors: FieldErrors<CreateQuoteInput>;
  watch: UseFormWatch<CreateQuoteInput>;
  setValue: UseFormSetValue<CreateQuoteInput>;
}

const FLAGS: {
  flagKey: keyof CreateQuoteInput;
  detailKey: keyof CreateQuoteInput;
  label: string;
  description: string;
  placeholder: string;
}[] = [
  {
    flagKey: "hasMedicalEquipment",
    detailKey: "medicalEquipmentDetails",
    label: "Medical equipment on board",
    description: "Stretcher, oxygen, or other medical equipment",
    placeholder: "Describe the equipment needed",
  },
  {
    flagKey: "hasVipRequirements",
    detailKey: "vipRequirementsDetails",
    label: "VIP requirements",
    description: "Security detail, ground handling, protocol needs",
    placeholder: "Describe VIP or protocol requirements",
  },
  {
    flagKey: "hasCargo",
    detailKey: "cargoDetails",
    label: "Cargo on board",
    description: "Equipment, freight, or luggage beyond standard allowance",
    placeholder: "Describe the cargo — weight, dimensions, type",
  },
  {
    flagKey: "hasPets",
    detailKey: "petsDetails",
    label: "Pets traveling",
    description: "Animals traveling with passengers",
    placeholder: "Describe the animal(s) traveling",
  },
  {
    flagKey: "hasDangerousGoods",
    detailKey: "dangerousGoodsDetails",
    label: "Dangerous goods",
    description: "Fuel, chemicals, firearms, or other regulated items",
    placeholder: "Describe the goods — our team will confirm carriage rules",
  },
];

export function RequirementsStep({ register, errors, watch, setValue }: RequirementsStepProps) {
  const attachments = watch("attachments") ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <FormField
        label="Special requests"
        htmlFor="specialRequests"
        hint="e.g. early morning departure, ground transport on arrival"
        error={errors.specialRequests?.message}
      >
        <Textarea id="specialRequests" {...register("specialRequests")} />
      </FormField>

      <div className="space-y-6 border-t border-slate-200 pt-6">
        {FLAGS.map((flag) => {
          const isChecked = watch(flag.flagKey as "hasMedicalEquipment") as boolean;

          return (
            <div key={flag.flagKey}>
              <ToggleSwitch
                label={flag.label}
                description={flag.description}
                {...register(flag.flagKey as "hasMedicalEquipment")}
              />
              {isChecked ? (
                <div className="mt-3 pl-14">
                  <Textarea
                    rows={2}
                    placeholder={flag.placeholder}
                    {...register(flag.detailKey as "medicalEquipmentDetails")}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 pt-6">
        <p className="mb-2 text-sm font-medium text-navy-900">Attachments</p>
        <p className="mb-3 text-xs text-slate-500">
          Optional — medical documentation, cargo manifests, or other supporting files.
        </p>
        <DocumentUploader attachments={attachments} onChange={(files) => setValue("attachments", files)} />
      </div>
    </div>
  );
}