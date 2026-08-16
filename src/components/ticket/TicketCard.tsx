"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Printer,
  DownloadSimple,
  CheckCircle,
  WarningCircle,
  Airplane,
  SealCheck,
  Compass,
  MapPinLine,
} from "@phosphor-icons/react";
import { siteConfig } from "@/lib/config/site";
import { formatDate } from "@/utils/date";
import { TICKET_STATUSES, TICKET_STATUS_LABELS, type TicketStatus } from "@/database/constants/ticket-status";

export interface TicketCardProps {
  ticketNumber: string;
  bookingNumber: string;
  passengerName: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  passengerCount: number;
  aircraftName?: string;
  aircraftRegistration?: string;
  qrDataUrl: string;
  pdfDownloadUrl: string;
  /**
   * Defaults to ISSUED so existing callers that haven't been updated
   * yet still render the pre-existing "paid" treatment. Callers
   * should pass the ticket's real status wherever it's known so a
   * cancelled/invalidated ticket never displays as paid — see Phase
   * 6 (premium redesign) requirement: unpaid/invalid bookings must
   * never incorrectly show "Paid in full".
   */
  status?: TicketStatus;
  /** Local departure time, e.g. "09:30" — omitted from the ticket until ops has set it via BookingTripDetailsActions. */
  departureTime?: string;
  /** FBO / terminal name and, optionally, its address — shown together as one "where to go" block. */
  fboName?: string;
  fboAddress?: string;
}

/**
 * The customer-facing digital charter ticket. Deliberately only
 * renders fields that actually exist on the booking/ticket/aircraft
 * models — no invented gates or baggage details (see Phase 2
 * requirement #3). departureTime/fboName/fboAddress come from the
 * booking once ops sets them and are simply omitted until then.
 *
 * Visual language (Phase 6): a restrained, private-aviation "travel
 * document" rather than a commercial-airline boarding pass — deep
 * navy header, a single champagne-gold accent, generous whitespace,
 * and a stub-style perforation between the journey/details body and
 * the QR/verification area. Colors and type all come from the site's
 * existing design tokens (src/styles/variables.css) — nothing new is
 * introduced.
 *
 * Print handling mirrors components/payment/Receipt/Receipt.tsx: a
 * scoped `@media print` block hides the site chrome (nav/footer) and
 * the action buttons, forces the accent colors to survive printing
 * (browsers strip backgrounds by default), and keeps the card from
 * being sliced across a page break.
 */
export function TicketCard({
  ticketNumber,
  bookingNumber,
  passengerName,
  departureAirportCode,
  destinationAirportCode,
  departureDate,
  passengerCount,
  aircraftName,
  aircraftRegistration,
  qrDataUrl,
  pdfDownloadUrl,
  status = TICKET_STATUSES.ISSUED,
  departureTime,
  fboName,
  fboAddress,
}: TicketCardProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          header,
          footer {
            display: none !important;
          }
          html,
          body {
            background: #fff !important;
          }
          .ticket-card,
          .ticket-card * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .ticket-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .ticket-actions {
            display: none !important;
          }
        }
      `}</style>

      {/* Actions */}
      <div className="ticket-actions mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-navy-900 transition-colors hover:border-navy-900/40 hover:bg-slate-50"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          Print Ticket
        </button>
        <a
          href={pdfDownloadUrl}
          className="flex items-center gap-1.5 rounded-lg border border-sky-200 px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-sky-600 transition-colors hover:border-sky-400 hover:bg-sky-50"
        >
          <DownloadSimple className="h-3.5 w-3.5" aria-hidden="true" />
          Download PDF
        </a>
      </div>

      <section
        aria-label={`Charter ticket ${ticketNumber}`}
        className="ticket-card relative overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-lifted print:border-slate-200 print:shadow-none"
      >
        <h2 className="sr-only">
          Private charter ticket {ticketNumber} for booking {bookingNumber}
        </h2>

        {/* Header */}
        <div className="relative overflow-hidden bg-navy-950 px-6 py-6 sm:px-9 sm:py-7">
          {/* Subtle coordinate-grid motif — restrained aviation texture, not decoration for its own sake. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(rgb(248 248 246) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <TicketLogoMark />
              <div>
                <p className="font-editorial text-base font-light text-white sm:text-lg">{siteConfig.name}</p>
                <p className="mt-0.5 text-[0.625rem] uppercase tracking-[0.2em] text-white/50">
                  Private Charter
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-champagne-400">
                Charter Ticket
              </p>
              <p className="spec-readout mt-1.5 text-sm font-semibold text-white">{ticketNumber}</p>
            </div>
          </div>
        </div>

        {/* Status strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-900/10 bg-slate-50/70 px-6 py-3 sm:px-9">
          <PaymentStatusPill status={status} />
          <p className="text-[0.6875rem] text-slate-500">
            Booking <span className="spec-readout text-slate-600">{bookingNumber}</span>
          </p>
        </div>

        {/* Journey — the visual centerpiece */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-center text-[9px] font-medium uppercase tracking-[0.3em] text-slate-400">
            Journey
          </p>
          <div className="mt-5 flex items-center justify-center gap-4 sm:gap-8">
            <div className="text-center">
              <p className="font-editorial text-4xl font-medium text-navy-900 sm:text-5xl">
                {departureAirportCode}
              </p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">Departure</p>
            </div>

            <div className="flex w-16 shrink-0 items-center gap-1.5 text-champagne-500 sm:w-28">
              <span className="h-px flex-1 bg-champagne-400/50" />
              <Airplane className="h-4 w-4 shrink-0 rotate-90" weight="light" aria-hidden="true" />
              <span className="h-px flex-1 bg-champagne-400/50" />
            </div>

            <div className="text-center">
              <p className="font-editorial text-4xl font-medium text-navy-900 sm:text-5xl">
                {destinationAirportCode}
              </p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">Destination</p>
            </div>
          </div>
          <p className="mt-7 text-center text-xs font-semibold uppercase tracking-[0.14em] text-navy-900 sm:text-sm">
            {formatDate(departureDate)}
            {departureTime ? (
              <span className="font-normal normal-case tracking-normal text-slate-500"> · {departureTime} local</span>
            ) : null}
          </p>
        </div>

        {/* Perforation — the two notches are clipped by the card's own
            overflow-hidden edge, so only the semicircle "bite" shows,
            regardless of what sits behind the card on the page. */}
        <div className="relative border-t border-dashed border-navy-900/15" role="presentation">
          <span
            aria-hidden="true"
            className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50"
          />
          <span
            aria-hidden="true"
            className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50"
          />
        </div>

        {/* Details + QR */}
        <div className="flex flex-col gap-8 px-6 py-7 sm:flex-row sm:px-9 sm:py-8">
          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-6">
            <DetailField label="Passenger" value={passengerName} />
            <DetailField
              label="Passengers"
              value={`${passengerCount} ${passengerCount === 1 ? "passenger" : "passengers"}`}
            />
            {aircraftName ? <DetailField label="Aircraft" value={aircraftName} /> : null}
            {aircraftRegistration ? (
              <DetailField label="Registration" value={aircraftRegistration} mono />
            ) : null}
            {fboName ? (
              <div className="col-span-2">
                <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  FBO / Terminal
                </dt>
                <dd className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-navy-900 sm:text-sm">
                  <MapPinLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne-500" weight="light" aria-hidden="true" />
                  <span>
                    {fboName}
                    {fboAddress ? (
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">{fboAddress}</span>
                    ) : null}
                  </span>
                </dd>
              </div>
            ) : null}
          </dl>

          {/* QR code */}
          <div className="flex shrink-0 flex-col items-center gap-3 border-t border-navy-900/10 pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <div className="rounded-lg border border-navy-900/10 bg-white p-2.5 shadow-crisp">
              {/* eslint-disable-next-line @next/next/no-img-element -- a base64 data URI, next/image can't optimize this and doesn't need to */}
              <img
                src={qrDataUrl}
                alt="QR code that verifies this ticket on the charter verification page"
                className="h-28 w-28 sm:h-32 sm:w-32"
              />
            </div>
            <p className="text-center text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Scan to Verify
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-navy-900/10 bg-slate-50/60 px-6 py-5 sm:px-9 sm:py-6">
          <div className="flex items-center justify-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400">
            <SealCheck className="h-3 w-3 text-champagne-500" weight="fill" aria-hidden="true" />
            Verified Digital Credential
          </div>
          <p className="mt-2 text-center text-[0.6875rem] leading-relaxed text-slate-500">
            This document confirms your private charter reservation with {siteConfig.name}.
            <span className="mt-0.5 block">Present it, digitally or printed, when required.</span>
          </p>
        </div>
      </section>
    </div>
  );
}

/**
 * Small header emblem. Reuses the exact same asset path and
 * graceful-degradation pattern as the site's own NavbarLogo (see
 * components/layout/navbar/Navbar.tsx) — if /logo/logo.png can't
 * load, it falls back to a Compass mark rather than a broken image or
 * an invented logo.
 */
function TicketLogoMark() {
  const [logoError, setLogoError] = useState(false);

  if (logoError) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-champagne-400/40 bg-white/5">
        <Compass className="h-4 w-4 text-champagne-400" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Image
      src="/logo/logo.png"
      alt=""
      width={140}
      height={40}
      onError={() => setLogoError(true)}
      className="h-7 w-auto object-contain"
    />
  );
}

function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className={`mt-1 text-xs font-semibold text-navy-900 sm:text-sm ${mono ? "spec-readout" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function PaymentStatusPill({ status }: { status: TicketStatus }) {
  const isValid = status === TICKET_STATUSES.ISSUED;
  const label = isValid ? "Paid in Full" : TICKET_STATUS_LABELS[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${
        isValid ? "border-green-600/20 bg-green-50 text-green-700" : "border-red-600/20 bg-red-50 text-red-700"
      }`}
    >
      {isValid ? (
        <CheckCircle className="h-3 w-3" weight="fill" aria-hidden="true" />
      ) : (
        <WarningCircle className="h-3 w-3" weight="fill" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}