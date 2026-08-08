"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
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

// Heading + one-line description shown above each step's fields. Kept
// alongside STEPS (same index) rather than duplicated inside each Step
// component, so there's one place that owns the step copy.
const STEP_META: { title: string; description: string }[] = [
  { title: "Trip details", description: "Where and when you'd like to fly." },
  { title: "Mission & aircraft", description: "What this trip is for, and any aircraft preference." },
  { title: "Requirements", description: "Special requests, equipment, or cargo we should know about." },
  { title: "Contact", description: "How our team should reach you with a quote." },
  { title: "Review", description: "Check everything over before you send it." },
];

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

  // Every button in this flow is type="button" — submission never happens
  // via a native <form> submit event (no Enter-to-submit, no implicit
  // submission, no risk of a same-node type="button" -> type="submit"
  // swap misfiring a submit in some browsers when Continue turns into
  // Submit on the last step). The only path to onSubmit running is the
  // Review step's button explicitly calling handleSubmit(onSubmit).
  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && event.target instanceof HTMLElement && event.target.tagName !== "TEXTAREA") {
      event.preventDefault();
    }
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

      {/* No border/shadow/bg here — this form is only ever rendered inside
          the white card wrapper on the request-charter page, which already
          supplies the card chrome. Keeping this bare avoids a nested
          double-card look. */}
      <form onSubmit={(event) => event.preventDefault()} onKeyDown={handleKeyDown} className="mt-6 sm:mt-7">
        <div key={step}>
          <h2 className="font-editorial text-[1.375rem] font-light text-navy-900 sm:text-2xl">
            {STEP_META[step - 1].title}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">{STEP_META[step - 1].description}</p>

          <div className="mt-5 sm:mt-6">
            {step === 1 ? (
              <TripDetailsStep register={register} errors={errors} watch={watch} setValue={setValue} />
            ) : null}
            {step === 2 ? (
              <MissionAircraftStep register={register} errors={errors} aircraftOptions={aircraftOptions} />
            ) : null}
            {step === 3 ? (
              <RequirementsStep register={register} errors={errors} watch={watch} setValue={setValue} />
            ) : null}
            {step === 4 ? <ContactStep register={register} errors={errors} /> : null}
            {step === 5 ? <ReviewStep values={getValues()} aircraftOptions={aircraftOptions} /> : null}
          </div>
        </div>

        {submitError ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 sm:mt-7 sm:pt-6">
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
            <Button key="continue" type="button" variant="primary" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button
              key="submit"
              type="button"
              variant="primary"
              onClick={handleSubmit(onSubmit)}
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