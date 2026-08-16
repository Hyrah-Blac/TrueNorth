import type { ReactNode } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import { useAirports } from "@/features/airport/hooks/useAirports";
import { formatBudgetRange } from "@/utils/currency";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";
import type { AircraftOption } from "./MissionAircraftStep";

function airportLabel(code: string, airports: { code: string; name: string }[]): string {
  const airport = airports.find((item) => item.code === code);
  return airport ? `${airport.name} (${airport.code})` : code;
}

interface ReviewStepProps {
  values: CreateQuoteInput;
  aircraftOptions: AircraftOption[];
  /** Jumps the parent form back to the given step (1-indexed, matching STEPS in CharterRequestForm) so the customer can fix something without restarting. */
  onEditStep: (step: number) => void;
}

export function ReviewStep({ values, aircraftOptions, onEditStep }: ReviewStepProps) {
  const selectedAircraft = aircraftOptions.find((item) => item._id === values.aircraftPreference);
  const budget = formatBudgetRange(values.budgetRangeMin, values.budgetRangeMax);
  const { airports } = useAirports();

  const flagSummaries = [
    values.hasMedicalEquipment && "Medical equipment",
    values.hasVipRequirements && "VIP requirements",
    values.hasCargo && "Cargo",
    values.hasPets && "Pets",
    values.hasDangerousGoods && "Dangerous goods",
  ].filter(Boolean) as string[];

  const tripRows = [
    { label: "Passengers", value: String(values.passengerCount) },
    {
      label: "Route",
      value: `${airportLabel(values.departureAirportCode, airports)} → ${airportLabel(values.destinationAirportCode, airports)}`,
    },
    {
      label: "Dates",
      value:
        values.isRoundTrip && values.returnDate
          ? `${String(values.departureDate)} – ${String(values.returnDate)}`
          : String(values.departureDate),
    },
  ];

  const missionRows = [
    { label: "Mission type", value: MISSION_TYPE_LABELS[values.missionType] },
    { label: "Aircraft preference", value: selectedAircraft?.name ?? "No preference" },
    ...(budget ? [{ label: "Budget", value: budget }] : []),
  ];

  const contactRows = [
    { label: "Name", value: values.contactInfo.fullName },
    { label: "Email", value: values.contactInfo.email },
    { label: "Phone", value: values.contactInfo.phone },
    ...(values.contactInfo.company ? [{ label: "Company", value: values.contactInfo.company }] : []),
  ];

  return (
    <div>
      <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
        Review your charter request before submitting. Each section can be edited before you send it.
      </p>

      <div className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
        <ReviewSection title="Your charter" step={1} onEditStep={onEditStep} rows={tripRows} />
        <ReviewSection title="Mission & aircraft" step={2} onEditStep={onEditStep} rows={missionRows} />

        {flagSummaries.length > 0 || values.specialRequests ? (
          <ReviewSection
            title="Requirements"
            step={3}
            onEditStep={onEditStep}
            rows={flagSummaries.length > 0 ? [{ label: "Flagged", value: flagSummaries.join(", ") }] : []}
          >
            {values.specialRequests ? (
              <p className="px-4 pb-3.5 text-xs leading-relaxed text-slate-600 sm:px-5 sm:pb-4 sm:text-sm">
                <span className="font-medium text-navy-900">Notes: </span>
                {values.specialRequests}
              </p>
            ) : null}
          </ReviewSection>
        ) : null}

        <ReviewSection title="Contact" step={4} onEditStep={onEditStep} rows={contactRows} />
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  step,
  onEditStep,
  rows,
  children,
}: {
  title: string;
  step: number;
  onEditStep: (step: number) => void;
  rows: { label: string; value: string }[];
  children?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5 sm:px-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        <button
          type="button"
          onClick={() => onEditStep(step)}
          className="flex items-center gap-1 text-[11px] font-medium text-sky-600 transition-colors hover:text-sky-700"
        >
          <PencilSimple className="h-3 w-3" aria-hidden="true" />
          Edit
        </button>
      </div>

      {rows.length > 0 ? (
        <dl>
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5 ${
                index % 2 === 1 ? "bg-slate-50/60" : "bg-white"
              }`}
            >
              <dt className="text-xs text-slate-500 sm:text-sm">{row.label}</dt>
              <dd className="spec-readout text-xs font-medium text-navy-900 sm:text-right sm:text-sm">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {children}
    </div>
  );
}
