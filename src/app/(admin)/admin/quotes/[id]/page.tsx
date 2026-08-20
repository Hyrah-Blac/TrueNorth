import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Users,
  Mail,
  Phone,
  Building2,
  Plane,
  Repeat,
  Paperclip,
  Clock,
  UserCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { QuoteStatusBadge } from "@/components/quote/QuoteStatusBadge";
import { QuoteReviewPanel } from "@/components/admin/dialogs/QuoteReviewPanel";
import { RouteDisplay } from "@/components/shared/RouteDisplay";
import { getQuoteForAdmin } from "@/features/admin/lib/getQuotesForAdmin";
import { getAircraftOptions } from "@/features/aircraft/lib/getAircraft";
import { getAirportNamesByCodes } from "@/lib/api/airportNames";
import { formatDate, formatDateTime } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import { AIRCRAFT_CATEGORY_LABELS } from "@/database/constants/aircraft";
import { QUOTE_TERMINAL_STATUSES, QUOTE_STATUSES } from "@/database/constants/quote-status";
import {
  DEPARTURE_TIME_PREFERENCE_LABELS,
  type DepartureTimePreference,
} from "@/database/constants/departure-time-preference";
import { LOCAL_TIME_REGEX } from "@/utils/validators";
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

  // Resolve full airport names for the premium route display
  const airportNames = await getAirportNamesByCodes([
    quote.departureAirportCode,
    quote.destinationAirportCode,
  ]);

  const canReview =
    !QUOTE_TERMINAL_STATUSES.includes(quote.status) && quote.status !== QUOTE_STATUSES.APPROVED;

  const preferredAircraft = typeof quote.aircraftPreference === "object" ? quote.aircraftPreference : undefined;
  const preferredAircraftId = preferredAircraft ? preferredAircraft._id : (quote.aircraftPreference as string | undefined);

  const customer = typeof quote.customer === "object" ? quote.customer : undefined;
  const reviewer = typeof quote.reviewedBy === "object" ? quote.reviewedBy : undefined;

  const specialFlags = [
    quote.hasMedicalEquipment && { label: "Medical equipment", detail: quote.medicalEquipmentDetails },
    quote.hasVipRequirements && { label: "VIP requirements", detail: quote.vipRequirementsDetails },
    quote.hasCargo && { label: "Cargo", detail: quote.cargoDetails },
    quote.hasPets && { label: "Pets", detail: quote.petsDetails },
    quote.hasDangerousGoods && { label: "Dangerous goods", detail: quote.dangerousGoodsDetails },
  ].filter(Boolean) as { label: string; detail?: string }[];

  const hasOutcomeInfo =
    quote.status === QUOTE_STATUSES.REJECTED ||
    quote.status === QUOTE_STATUSES.APPROVED ||
    quote.status === QUOTE_STATUSES.CONVERTED ||
    quote.status === QUOTE_STATUSES.EXPIRED ||
    Boolean(quote.adminNotes);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr,1fr]">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <div className="flex items-start justify-between gap-4">
            {/* ── Premium route hero — replaces the plain "DEP → DEST" h2 ── */}
            <RouteDisplay
              eyebrow={quote.quoteNumber}
              departure={{
                code: quote.departureAirportCode,
                name: airportNames[quote.departureAirportCode],
              }}
              destination={{
                code: quote.destinationAirportCode,
                name: airportNames[quote.destinationAirportCode],
              }}
              size="md"
            />
            <div className="shrink-0 pt-1">
              <QuoteStatusBadge status={quote.status} />
            </div>
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
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Repeat className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
              {quote.isRoundTrip ? "Round trip" : "One way"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
              Submitted {formatDateTime(quote.createdAt)}
            </div>
            {quote.departureTime ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                Confirmed departure time: {quote.departureTime}
              </div>
            ) : quote.departureTimePreference ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                Requested{" "}
                {LOCAL_TIME_REGEX.test(quote.departureTimePreference)
                  ? quote.departureTimePreference
                  : (DEPARTURE_TIME_PREFERENCE_LABELS[
                      quote.departureTimePreference as DepartureTimePreference
                    ] ?? quote.departureTimePreference
                    ).toLowerCase()}
              </div>
            ) : null}
          </div>

          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-6">
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-slate-500">Mission type</dt>
              <dd className="text-right font-medium text-navy-900">{MISSION_TYPE_LABELS[quote.missionType]}</dd>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-slate-500">Preferred aircraft</dt>
              <dd className="text-right font-medium text-navy-900">
                {preferredAircraft ? preferredAircraft.name : "No preference"}
              </dd>
            </div>
            {quote.budgetRangeMin || quote.budgetRangeMax ? (
              <div className="flex justify-between gap-4 text-sm">
                <dt className="text-slate-500">Budget</dt>
                <dd className="text-right font-medium text-navy-900">
                  {quote.budgetRangeMin ? formatCurrency(quote.budgetRangeMin, quote.currency) : "—"} –{" "}
                  {quote.budgetRangeMax ? formatCurrency(quote.budgetRangeMax, quote.currency) : "—"}
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

        {quote.attachments.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-7">
            <h3 className="font-display text-base font-semibold text-navy-900">
              Attachments ({quote.attachments.length})
            </h3>
            <div className="mt-4 space-y-2">
              {quote.attachments.map((file) => (
                <a
                  key={file.publicId}
                  href={file.viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-600 transition-colors duration-300 hover:border-sky-300 hover:bg-sky-50/40 hover:text-sky-700"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-medium text-navy-900">{file.fileName}</span>
                  <span className="spec-readout shrink-0 text-xs uppercase text-slate-400">{file.fileType}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {canReview ? (
          <div className="rounded-xl border border-slate-200 bg-white p-7">
            <h3 className="font-display text-base font-semibold text-navy-900">Review this request</h3>
            <div className="mt-4">
              <QuoteReviewPanel
                quoteId={quote._id}
                aircraftOptions={aircraftOptions}
                preferredAircraftId={preferredAircraftId}
                hasCustomer={Boolean(quote.customer)}
                suggestedEmail={quote.contactInfo.email}
                currentDepartureDate={quote.departureDate}
                currentDepartureTime={quote.departureTime}
                departureTimePreference={quote.departureTimePreference}
              />
            </div>
          </div>
        ) : null}

        {hasOutcomeInfo ? (
          <div className="rounded-xl border border-slate-200 bg-white p-7">
            <h3 className="font-display text-base font-semibold text-navy-900">Outcome</h3>

            <div className="mt-4 space-y-4">
              {quote.status === QUOTE_STATUSES.REJECTED && quote.rejectionReason ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <span className="font-medium">Rejected: </span>
                  {quote.rejectionReason}
                </div>
              ) : null}

              {quote.status === QUOTE_STATUSES.EXPIRED ? (
                <p className="text-sm text-slate-600">This quote expired without a decision being made.</p>
              ) : null}

              {quote.status === QUOTE_STATUSES.APPROVED ? (
                <p className="text-sm text-slate-600">
                  Sent to the customer for review. Awaiting their decision to accept or decline.
                </p>
              ) : null}

              {quote.quotedAmount ? (
                <dl className="space-y-3">
                  <div className="flex justify-between gap-4 text-sm">
                    <dt className="text-slate-500">Quoted amount</dt>
                    <dd className="text-right font-medium text-navy-900">
                      {formatCurrency(quote.quotedAmount, quote.quotedCurrency ?? quote.currency)}
                    </dd>
                  </div>
                  {quote.validUntil ? (
                    <div className="flex justify-between gap-4 text-sm">
                      <dt className="text-slate-500">Valid until</dt>
                      <dd className="text-right font-medium text-navy-900">{formatDate(quote.validUntil)}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              {quote.status === QUOTE_STATUSES.CONVERTED && quote.convertedBooking ? (
                <Link
                  href={`/admin/bookings/${quote.convertedBooking}`}
                  className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  View converted booking
                </Link>
              ) : null}

              {quote.adminNotes ? (
                <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  <span className="font-medium text-navy-900">Admin notes: </span>
                  {quote.adminNotes}
                </div>
              ) : null}

              {reviewer || quote.reviewedAt ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <UserCheck className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden="true" />
                  Reviewed{reviewer ? ` by ${reviewer.firstName} ${reviewer.lastName}` : ""}
                  {quote.reviewedAt ? ` on ${formatDateTime(quote.reviewedAt)}` : ""}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <aside className="h-fit space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-7">
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

          <div className="mt-5 border-t border-slate-100 pt-4">
            {customer ? (
              <Link
                href={`/admin/customers/${customer._id}`}
                className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                Linked account — view customer
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <UserCheck className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                No linked customer account
              </p>
            )}
          </div>
        </div>

        {preferredAircraft ? (
          <div className="rounded-xl border border-slate-200 bg-white p-7">
            <h3 className="font-display text-base font-semibold text-navy-900">Preferred aircraft</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 font-medium text-navy-900">
                <Plane className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                {preferredAircraft.name}
              </div>
              <p className="text-slate-500">{AIRCRAFT_CATEGORY_LABELS[preferredAircraft.category]}</p>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <h3 className="font-display text-base font-semibold text-navy-900">Timeline</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Submitted</dt>
              <dd className="text-right font-medium text-navy-900">{formatDateTime(quote.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Last updated</dt>
              <dd className="text-right font-medium text-navy-900">{formatDateTime(quote.updatedAt)}</dd>
            </div>
            {quote.reviewedAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Reviewed</dt>
                <dd className="text-right font-medium text-navy-900">{formatDateTime(quote.reviewedAt)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </aside>
    </div>
  );
}
