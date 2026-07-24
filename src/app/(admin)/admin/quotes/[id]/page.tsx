import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Users, Mail, Phone, Building2 } from "lucide-react";
import { QuoteStatusBadge } from "@/components/quote/QuoteStatusBadge";
import { QuoteReviewPanel } from "@/components/admin/dialogs/QuoteReviewPanel";
import { getQuoteForAdmin } from "@/features/admin/lib/getQuotesForAdmin";
import { getAircraftOptions } from "@/features/aircraft/lib/getAircraft";
import { formatDate } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import { QUOTE_TERMINAL_STATUSES, QUOTE_STATUSES } from "@/database/constants/quote-status";
import { NotFoundError, isAppError } from "@/lib/errors/AppError";

export const metadata: Metadata = { title: "Quote Details" };

interface AdminQuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminQuoteDetailPage({ params }: AdminQuoteDetailPageProps) {
  const { id } = await params;

  let quote;
  try {
    quote = await getQuoteForAdmin(id);
  } catch (error) {
    if (isAppError(error) && error instanceof NotFoundError) notFound();
    throw error;
  }

  const aircraftOptions = await getAircraftOptions();
  const canReview = !QUOTE_TERMINAL_STATUSES.includes(quote.status);
  const preferredAircraftId =
    typeof quote.aircraftPreference === "object" ? quote.aircraftPreference?._id : quote.aircraftPreference;

  const specialFlags = [
    quote.hasMedicalEquipment && { label: "Medical equipment", detail: quote.medicalEquipmentDetails },
    quote.hasVipRequirements && { label: "VIP requirements", detail: quote.vipRequirementsDetails },
    quote.hasCargo && { label: "Cargo", detail: quote.cargoDetails },
    quote.hasPets && { label: "Pets", detail: quote.petsDetails },
    quote.hasDangerousGoods && { label: "Dangerous goods", detail: quote.dangerousGoodsDetails },
  ].filter(Boolean) as { label: string; detail?: string }[];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr,1fr]">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="spec-readout text-sm text-slate-500">{quote.quoteNumber}</p>
              <h2 className="mt-1 font-editorial text-2xl font-light italic text-navy-900">
                {quote.departureAirportCode} → {quote.destinationAirportCode}
              </h2>
            </div>
            <QuoteStatusBadge status={quote.status} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
              {formatDate(quote.departureDate)}
              {quote.isRoundTrip && quote.returnDate ? ` – ${formatDate(quote.returnDate)}` : ""}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
              {quote.passengerCount} passengers
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-6">
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Mission type</dt>
              <dd className="font-medium text-navy-900">{MISSION_TYPE_LABELS[quote.missionType]}</dd>
            </div>
            {quote.budgetRangeMin || quote.budgetRangeMax ? (
              <div className="flex justify-between text-sm">
                <dt className="text-slate-500">Budget</dt>
                <dd className="font-medium text-navy-900">
                  {quote.budgetRangeMin ? formatCurrency(quote.budgetRangeMin) : "—"} –{" "}
                  {quote.budgetRangeMax ? formatCurrency(quote.budgetRangeMax) : "—"}
                </dd>
              </div>
            ) : null}
          </dl>

          {quote.specialRequests ? (
            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <span className="font-medium text-navy-900">Notes: </span>
              {quote.specialRequests}
            </div>
          ) : null}

          {specialFlags.length > 0 ? (
            <div className="mt-4 space-y-2">
              {specialFlags.map((flag) => (
                <div key={flag.label} className="rounded-lg border border-gold-200 bg-gold-200/10 p-3 text-sm">
                  <span className="font-medium text-navy-900">{flag.label}: </span>
                  <span className="text-slate-600">{flag.detail || "No further details provided"}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {canReview ? (
          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
            <h3 className="font-display text-base font-semibold text-navy-900">Review this request</h3>
            <div className="mt-4">
              <QuoteReviewPanel
                quoteId={quote._id}
                aircraftOptions={aircraftOptions}
                preferredAircraftId={preferredAircraftId}
              />
            </div>
          </div>
        ) : quote.status === QUOTE_STATUSES.REJECTED && quote.rejectionReason ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <span className="font-medium">Rejected: </span>
            {quote.rejectionReason}
          </div>
        ) : null}
      </div>

      <aside className="h-fit space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-soft">
          <h3 className="font-display text-base font-semibold text-navy-900">Requested by</h3>
          <div className="mt-4 space-y-3 text-sm">
            <p className="font-medium text-navy-900">{quote.contactInfo.fullName}</p>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
              <a href={`mailto:${quote.contactInfo.email}`} className="hover:text-sky-600">
                {quote.contactInfo.email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
              <a href={`tel:${quote.contactInfo.phone}`} className="hover:text-sky-600">
                {quote.contactInfo.phone}
              </a>
            </div>
            {quote.contactInfo.company ? (
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {quote.contactInfo.company}
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
