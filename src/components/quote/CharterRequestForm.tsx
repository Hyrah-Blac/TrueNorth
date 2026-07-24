"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import { TripDetailsStep } from "./steps/TripDetailsStep";
import { MissionAircraftStep, type AircraftOption } from "./steps/MissionAircraftStep";
import { RequirementsStep } from "./steps/RequirementsStep";
import { ContactStep } from "./steps/ContactStep";
import { ReviewStep } from "./steps/ReviewStep";
import { Button } from "@/components/shared/buttons/Button";
import { SuccessState } from "@/components/feedback/SuccessState/SuccessState";
import { createQuoteSchema, type CreateQuoteInput } from "@/features/quote/schemas/quote.schema";
import { submitCharterRequest } from "@/features/quote/actions/quote.actions";

const STEPS = ["Trip Details", "Mission & Aircraft", "Requirements", "Contact", "Review"];

// Fields validated before advancing past each step — keeps errors
// scoped to what's visible instead of surfacing step-5 errors on step 1.
const STEP_FIELDS: (keyof CreateQuoteInput)[][] = [
  ["passengerCount", "departureAirportCode", "destinationAirportCode", "departureDate", "returnDate", "isRoundTrip"],
  ["missionType", "aircraftPreference", "budgetRangeMin", "budgetRangeMax"],
  [
    "specialRequests",
    "hasMedicalEquipment",
    "medicalEquipmentDetails",
    "hasVipRequirements",
    "vipRequirementsDetails",
    "hasCargo",
    "cargoDetails",
    "hasPets",
    "petsDetails",
    "hasDangerousGoods",
    "dangerousGoodsDetails",
  ],
  ["contactInfo"],
  [],
];

interface CharterRequestFormProps {
  aircraftOptions: AircraftOption[];
  defaultValues?: Partial<CreateQuoteInput>;
}

export function CharterRequestForm({ aircraftOptions, defaultValues }: CharterRequestFormProps) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    getValues,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      isRoundTrip: false,
      hasMedicalEquipment: false,
      hasVipRequirements: false,
      hasCargo: false,
      hasPets: false,
      hasDangerousGoods: false,
      attachments: [],
      ...defaultValues,
    },
  });

  async function goNext() {
    const fields = STEP_FIELDS[step - 1];
    const valid = fields.length === 0 ? true : await trigger(fields);
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 1));
  }

  function onSubmit(data: CreateQuoteInput) {
    setSubmitError(null);

    startTransition(async () => {
      const result = await submitCharterRequest(data);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof CreateQuoteInput, { message });
          }
        }
        setSubmitError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      setQuoteNumber(result.quoteNumber ?? null);
    });
  }

  if (quoteNumber) {
    return (
      <SuccessState
        title="Charter request received"
        description={`Reference ${quoteNumber} — our operations team will review your request and follow up by email with aircraft recommendations and pricing, usually within a few hours.`}
        primaryAction={{ label: "Back to Home", href: "/" }}
      />
    );
  }

  return (
    <div>
      <StepIndicator steps={STEPS} currentStep={step} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-12 rounded-xl border border-slate-200 p-8 shadow-soft sm:p-10"
      >
        <div key={step} className="animate-fade-up-editorial">
          {step === 1 ? <TripDetailsStep register={register} errors={errors} watch={watch} /> : null}
          {step === 2 ? (
            <MissionAircraftStep register={register} errors={errors} aircraftOptions={aircraftOptions} />
          ) : null}
          {step === 3 ? (
            <RequirementsStep register={register} errors={errors} watch={watch} setValue={setValue} />
          ) : null}
          {step === 4 ? <ContactStep register={register} errors={errors} /> : null}
          {step === 5 ? <ReviewStep values={getValues()} aircraftOptions={aircraftOptions} /> : null}
        </div>

        {submitError ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            className={step === 1 ? "invisible" : ""}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>

          {step < STEPS.length ? (
            <Button type="button" variant="primary" onClick={goNext} icon={<ArrowRight className="h-4 w-4" />}>
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isPending ? "Submitting…" : "Submit Charter Request"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
