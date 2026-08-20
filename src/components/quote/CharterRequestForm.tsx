"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { TripSearchBar, type TripSearchBarValues } from "./TripSearchBar";
import { DetailsContactStep } from "./steps/DetailsContactStep";
import { Button } from "@/components/shared/buttons/Button";
import { Reveal } from "@/components/shared/Reveal";
import { HorizonDivider } from "@/components/layout/section/Section";
import { SuccessState } from "@/components/feedback/SuccessState/SuccessState";
import { createQuoteSchema, type CreateQuoteInput } from "@/features/quote/schemas/quote.schema";
import { submitCharterRequest } from "@/features/quote/actions/quote.actions";
// Fields validated before leaving the search bar and revealing the
// contact section — keeps trip-detail errors from surfacing under the
// contact fields, and vice versa.
const TRIP_FIELDS: (keyof CreateQuoteInput)[] = [
  "passengerCount",
  "departureAirportCode",
  "destinationAirportCode",
  "departureDate",
  "returnDate",
  "isRoundTrip",
];

// Autosave: a customer who accidentally reloads (or the tab crashes,
// or they hit back/forward) mid-form shouldn't have to start the whole
// trip + contact flow over. Draft is scoped to sessionStorage rather
// than localStorage — it survives a reload within the same tab, which
// is the actual complaint, without leaving a customer's name/email/
// phone sitting in the browser indefinitely once the tab is closed.
const DRAFT_STORAGE_KEY = "charterRequestDraft:v1";
const DRAFT_SAVE_DEBOUNCE_MS = 400;

interface CharterRequestDraft {
  step: 1 | 2;
  trip: Partial<CreateQuoteInput>;
  contact: Partial<ContactFieldsInput>;
}

function loadDraft(): CharterRequestDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CharterRequestDraft;
  } catch {
    return null;
  }
}

function saveDraft(draft: CharterRequestDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage can fail (private browsing, quota) — silently skipping the
    // autosave isn't worth surfacing to the customer mid-form.
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Small, form-only schema for the two name fields the new design splits
// out of contactInfo.fullName (Title / First name / Last name). These
// aren't part of createQuoteSchema or the Quote database model — they're
// combined into a single contactInfo.fullName string right before
// submission, so the backend, admin views, and emails all keep working
// against the same fullName shape they already expect.
const contactFieldsSchema = z.object({
  title: z.string().trim().max(20).optional(),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
});
export type ContactFieldsInput = z.infer<typeof contactFieldsSchema>;

interface CharterRequestFormProps {
  defaultValues?: Partial<CreateQuoteInput>;
}

export function CharterRequestForm({ defaultValues }: CharterRequestFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      isRoundTrip: false,
      // The search bar always displays "1 Passenger" out of the box (it
      // has to show something), so the underlying field needs the same
      // default — otherwise a customer who never touches the passenger
      // stepper would hit a "required" validation error on a field that
      // visually already looked filled in.
      passengerCount: 1,
      // Mission type, aircraft preference, budget range, and the
      // equipment/VIP/cargo/pets/dangerous-goods flags no longer have
      // their own steps in this flow (see DetailsContactStep) — they
      // keep sane defaults here so the schema still validates, and any
      // of them can still arrive prefilled via query params (e.g. a
      // "Request this aircraft" link from the fleet page).
      missionType: "other",
      hasMedicalEquipment: false,
      hasVipRequirements: false,
      hasCargo: false,
      hasPets: false,
      hasDangerousGoods: false,
      attachments: [],
      ...defaultValues,
    },
  });

  const {
    register: registerContact,
    handleSubmit: handleContactSubmit,
    watch: watchContact,
    reset: resetContact,
    formState: { errors: contactErrors },
  } = useForm<ContactFieldsInput>({
    resolver: zodResolver(contactFieldsSchema),
    defaultValues: { title: "Mr." },
  });

  // Restore a saved draft once, on mount. Runs after both forms exist so
  // reset() has something to reset from; the effect intentionally only
  // fires once (empty deps) — restoring is a one-time hydration, not an
  // ongoing sync.
  const hasRestoredDraft = useRef(false);
  useEffect(() => {
    if (hasRestoredDraft.current) return;
    hasRestoredDraft.current = true;

    const draft = loadDraft();
    if (!draft) return;

    if (draft.trip) reset((current) => ({ ...current, ...draft.trip }));
    if (draft.contact) resetContact((current) => ({ ...current, ...draft.contact }));
    if (draft.step) setStep(draft.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedTrip = watch();
  const watchedContact = watchContact();

  // The trip form's schema requires contactInfo.fullName, but the title/
  // first/last name fields live on the separate contact form and only get
  // combined into fullName inside onSubmit — which runs too late, since
  // handleSubmit's own zod validation already needs contactInfo.fullName
  // to be present *before* onSubmit is called. Keep it synced onto the
  // trip form as the customer types so that validation (and therefore
  // submission) actually passes.
  useEffect(() => {
    const fullName = [watchedContact.title, watchedContact.firstName, watchedContact.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    setValue("contactInfo.fullName", fullName, { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedContact.title, watchedContact.firstName, watchedContact.lastName]);

  // Autosave both forms' current values (plus which step the customer is
  // on) to sessionStorage, debounced so a reload never loses more than a
  // few hundred milliseconds of typing.
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasRestoredDraft.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft({ step, trip: watchedTrip, contact: watchedContact });
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, JSON.stringify(watchedTrip), JSON.stringify(watchedContact)]);

  const tripValues = watch([
    "departureAirportCode",
    "destinationAirportCode",
    "departureDate",
    "returnDate",
    "isRoundTrip",
    "departureTimePreference",
    "passengerCount",
  ]);
  const searchBarValues: TripSearchBarValues = {
    departureAirportCode: tripValues[0] ?? "",
    destinationAirportCode: tripValues[1] ?? "",
    departureDate: tripValues[2] ? String(tripValues[2]) : "",
    returnDate: tripValues[3] ? String(tripValues[3]) : undefined,
    isRoundTrip: tripValues[4] ?? false,
    departureTimePreference: tripValues[5] ?? undefined,
    passengerCount: tripValues[6] ?? 1,
  };

  // TripSearchBarValues' keys are a subset of CreateQuoteInput's, but
  // react-hook-form's setValue overloads key off a literal Path<T>
  // rather than a generic passed-through key, so this goes through a
  // loosely-typed helper rather than fighting that generic at every
  // call site.
  const setTripValue = setValue as (field: keyof TripSearchBarValues, value: unknown, options?: { shouldValidate?: boolean }) => void;

  function handleSearchBarChange<K extends keyof TripSearchBarValues>(field: K, value: TripSearchBarValues[K]) {
    // returnDate is optional in the schema (z.coerce.date().optional()),
    // but optional() only treats `undefined` as "not provided" — an
    // empty string still gets passed to `new Date("")`, which is an
    // Invalid Date, surfacing a spurious "Invalid date" error whenever
    // the return date is cleared or round-trip is toggled off. Coerce
    // that case to undefined before it reaches the resolver.
    const nextValue = field === "returnDate" && value === "" ? undefined : value;
    setTripValue(field, nextValue, { shouldValidate: true });
  }

  async function goToDetails() {
    const valid = await trigger(TRIP_FIELDS);
    if (valid) setStep(2);
  }

  function goBack() {
    setStep(1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && event.target instanceof HTMLElement && event.target.tagName !== "TEXTAREA") {
      event.preventDefault();
    }
  }

  function onSubmit(data: CreateQuoteInput) {
    handleContactSubmit((contact) => {
      setSubmitError(null);

      const fullName = [contact.title, contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();

      startTransition(async () => {
        const result = await submitCharterRequest({
          ...data,
          contactInfo: { ...data.contactInfo, fullName },
        });

        if (!result.success) {
          if (result.fieldErrors) {
            for (const [field, message] of Object.entries(result.fieldErrors)) {
              setError(field as keyof CreateQuoteInput, { message });
            }
          }
          setSubmitError(result.error ?? "Something went wrong. Please try again.");
          return;
        }

        clearDraft();
        setQuoteNumber(result.quoteNumber ?? null);
      });
    })();
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
    <form onSubmit={(event) => event.preventDefault()} onKeyDown={handleKeyDown}>
      <TripSearchBar
        values={searchBarValues}
        onChange={handleSearchBarChange}
        errors={{
          departureAirportCode: errors.departureAirportCode?.message,
          destinationAirportCode: errors.destinationAirportCode?.message,
          departureDate: errors.departureDate?.message,
          returnDate: errors.returnDate?.message,
        }}
        onSubmit={step === 1 ? goToDetails : undefined}
      />

      {step === 2 ? (
        <Reveal variant="fade-up" className="mt-12 sm:mt-16">
          <HorizonDivider className="mb-10 sm:mb-14" />

          <DetailsContactStep
            register={register}
            errors={errors}
            contactRegister={registerContact}
            contactErrors={contactErrors}
            phoneValue={watchedTrip.contactInfo?.phone ?? ""}
            onPhoneChange={(value) => setValue("contactInfo.phone", value, { shouldValidate: true })}
          />

          {submitError ? (
            <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="mt-10 flex flex-col-reverse items-center gap-4 sm:mt-12 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" size="md" onClick={goBack} className="w-full sm:w-auto">
              Back
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSubmit(onSubmit)}
              disabled={isPending}
              icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              className="w-full sm:w-auto"
            >
              {isPending ? "Submitting…" : "Submit Charter Request"}
            </Button>
          </div>
        </Reveal>
      ) : null}
    </form>
  );
}