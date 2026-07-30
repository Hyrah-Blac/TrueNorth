import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import { airports } from "@/content/airports";
import { formatBudgetRange } from "@/utils/currency";
import type { CreateQuoteInput } from "@/features/quote/schemas/quote.schema";
import type { AircraftOption } from "./MissionAircraftStep";

function airportLabel(code: string): string {
  const airport = airports.find((item) => item.code === code);
  return airport ? `${airport.name} (${airport.code})` : code;
}

export function ReviewStep({
  values,
  aircraftOptions,
}: {
  values: CreateQuoteInput;
  aircraftOptions: AircraftOption[];
}) {
  const selectedAircraft = aircraftOptions.find((item) => item._id === values.aircraftPreference);
  const budget = formatBudgetRange(values.budgetRangeMin, values.budgetRangeMax);

  const flagSummaries = [
    values.hasMedicalEquipment && "Medical equipment",
    values.hasVipRequirements && "VIP requirements",
    values.hasCargo && "Cargo",
    values.hasPets && "Pets",
    values.hasDangerousGoods && "Dangerous goods",
  ].filter(Boolean) as string[];

  const rows: { label: string; value: string }[] = [
    { label: "Passengers", value: String(values.passengerCount) },
    { label: "Route", value: `${airportLabel(values.departureAirportCode)} → ${airportLabel(values.destinationAirportCode)}` },
    {
      label: "Dates",
      value: values.isRoundTrip && values.returnDate
        ? `${String(values.departureDate)} – ${String(values.returnDate)}`
        : String(values.departureDate),
    },
    { label: "Mission type", value: MISSION_TYPE_LABELS[values.missionType] },
    { label: "Aircraft preference", value: selectedAircraft?.name ?? "No preference" },
    ...(budget ? [{ label: "Budget", value: budget }] : []),
    ...(flagSummaries.length > 0 ? [{ label: "Special requirements", value: flagSummaries.join(", ") }] : []),
    { label: "Contact", value: `${values.contactInfo.fullName} · ${values.contactInfo.email}` },
    { label: "Phone", value: values.contactInfo.phone },
    ...(values.contactInfo.company ? [{ label: "Company", value: values.contactInfo.company }] : []),
  ];

  return (
    <div>
      <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
        Review your charter request before submitting. Our operations team will follow up with
        aircraft recommendations and pricing.
      </p>

      <dl className="mt-5 overflow-hidden rounded-xl border border-slate-200 sm:mt-6">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5 ${
              index % 2 === 1 ? "bg-slate-50" : "bg-white"
            }`}
          >
            <dt className="text-xs text-slate-500 sm:text-sm">{row.label}</dt>
            <dd className="spec-readout text-xs font-medium text-navy-900 sm:text-right sm:text-sm">{row.value}</dd>
          </div>
        ))}
      </dl>

      {values.specialRequests ? (
        <div className="mt-4 rounded-md bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600 sm:p-4 sm:text-sm">
          <span className="font-medium text-navy-900">Notes: </span>
          {values.specialRequests}
        </div>
      ) : null}
    </div>
  );
}