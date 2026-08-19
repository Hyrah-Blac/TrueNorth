"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Printer,
  DownloadSimple,
  CheckCircle,
  WarningCircle,
  SealCheck,
  Compass,
  MapPinLine,
  Airplane,
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
  /**
   * Real city for the departure/destination ICAO code, from the
   * Airport collection (see getTicketAirportCities). Omitted — never
   * invented — when that airport isn't in the database.
   */
  departureAirportName?: string;
  destinationAirportName?: string;
  /**
   * Contact details shown in the header/footer. All three are
   * optional and fall back to the static defaults in site.ts — but
   * the ticket page (a server component) should always pass the
   * admin-configured values from getSiteSettings(), so a phone number
   * or email changed in admin settings shows up on the ticket without
   * a code deploy. This client component can't call getSiteSettings()
   * itself (server-only, hits the database).
   */
  companyName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

/**
 * Ticket color palette (Phase 7 — colour refinement pass). Kept as
 * arbitrary-value Tailwind classes scoped to this component rather
 * than edited into src/styles/variables.css, since those tokens
 * (navy-950, champagne-400, etc.) are shared across the entire site —
 * this refinement is deliberately contained to the ticket surface
 * only. generateTicketPdf.tsx mirrors this exact palette in its own
 * local COLORS constant so the emailed/downloaded PDF and this web
 * card read as one document.
 *
 * Balance: warm ivory is the one field color for the whole document;
 * deep midnight navy is reserved for the header band; champagne gold
 * is limited to route details, micro-label accents, and verification
 * details — never a background fill. Divider hairlines use a single
 * neutral so the ivory field never looks "dirty".
 */
const INK = "#101828"; // primary text — airport codes, values, headings
const TEXT_SECONDARY = "#667085"; // supporting text — captions under codes, footer copy
const LABEL_MUTED = "#8492A6"; // small uppercase field labels
const HAIRLINE = "#D9DEE5"; // all dividers/borders on the ivory field
const IVORY = "#FAF9F6"; // the one document background
const NAVY_PRIMARY = "#071A2B"; // header band
const NAVY_SECONDARY = "#102A43"; // restrained secondary ink (small icons, hover)
const GOLD = "#C6A15B"; // champagne gold — on ivory
const GOLD_SOFT = "#D6B978"; // soft gold highlight — on navy
const PAID_TEXT = "#176B4D";
const PAID_BG = "#ECF7F1";

/**
 * The customer-facing digital charter ticket. Deliberately only
 * renders fields that actually exist on the booking/ticket/aircraft
 * models — no invented gates or baggage details (see Phase 2
 * requirement #3). departureTime/fboName/fboAddress come from the
 * booking once ops sets them and are simply omitted until then.
 *
 * Visual language (Phase 6 — premium redesign; Phase 7 — colour
 * refinement): a restrained, private-aviation travel document rather
 * than a commercial-airline boarding pass — a single warm-ivory field,
 * a deep-midnight-navy header, a champagne-gold accent used only for
 * route details/micro-labels/verification, generous whitespace, and a
 * stub-style perforation between the journey/details body and the
 * QR/verification area.
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
  departureAirportName,
  destinationAirportName,
  companyName = siteConfig.name,
  contactPhone = siteConfig.phoneDisplay,
  contactEmail = siteConfig.email,
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
          style={{ borderColor: HAIRLINE, color: INK }}
          className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors hover:bg-[#F4F2EC]"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          Print Ticket
        </button>
        <a
          href={pdfDownloadUrl}
          style={{ borderColor: "#E4D3AE", color: "#8A6D34" }}
          className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] transition-colors hover:bg-[#FBF6EA]"
        >
          <DownloadSimple className="h-3.5 w-3.5" aria-hidden="true" />
          Download PDF
        </a>
      </div>

      <section
        aria-label={`Charter ticket ${ticketNumber}`}
        style={{ backgroundColor: IVORY, borderColor: HAIRLINE }}
        className="ticket-card relative overflow-hidden rounded-2xl border shadow-lifted print:shadow-none"
      >
        <h2 className="sr-only">
          Private charter ticket {ticketNumber} for booking {bookingNumber}
        </h2>

        {/* Header */}
        <div style={{ backgroundColor: NAVY_PRIMARY }} className="relative overflow-hidden px-6 py-7 sm:px-10 sm:py-8">
          {/* Subtle coordinate-grid motif — restrained aviation texture, not decoration for its own sake. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(rgb(250 249 246) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <TicketLogoMark />
              <div>
                <p className="font-editorial text-lg font-light tracking-[0.01em] text-white sm:text-xl">
                  {companyName}
                </p>
                <p style={{ color: GOLD_SOFT }} className="mt-0.5 text-[0.625rem] uppercase tracking-[0.28em] opacity-90">
                  Private Aviation
                </p>
              </div>
            </div>
            <div className="text-right">
              <p style={{ color: GOLD_SOFT }} className="text-[9px] font-medium uppercase tracking-[0.22em]">
                Private Charter Confirmation
              </p>
              <p className="spec-readout mt-2 text-sm font-semibold text-white">{ticketNumber}</p>
            </div>
          </div>
        </div>

        {/* Status strip — a hairline-bounded band on the same ivory
            field as the rest of the card, not a separate grey panel;
            keeps the document to one background color throughout. */}
        <div
          style={{ borderColor: HAIRLINE }}
          className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3.5 sm:px-10"
        >
          <PaymentStatusPill status={status} />
          <p style={{ color: LABEL_MUTED }} className="text-[0.6875rem] uppercase tracking-[0.1em]">
            Booking <span style={{ color: TEXT_SECONDARY }} className="spec-readout normal-case tracking-normal">{bookingNumber}</span>
          </p>
        </div>

        {/* Journey — the visual centerpiece */}
        <div className="px-6 py-10 sm:px-10 sm:py-14">
          <p style={{ color: GOLD }} className="text-center text-[9px] font-semibold uppercase tracking-[0.4em]">
            Journey
          </p>
          <div className="mt-6 flex items-start justify-center gap-5 sm:gap-10">
            <div className="text-center">
              <p style={{ color: INK }} className="font-editorial text-5xl font-semibold leading-none tracking-tight sm:text-6xl">
                {departureAirportCode}
              </p>
              {departureAirportName ? (
                <p style={{ color: TEXT_SECONDARY }} className="mt-2 text-xs font-medium sm:text-sm">
                  {departureAirportName}
                </p>
              ) : null}
              <p style={{ color: LABEL_MUTED }} className="mt-1.5 text-[10px] uppercase tracking-[0.2em]">
                Departure
              </p>
            </div>

            <div className="flex w-14 shrink-0 items-center gap-2 pt-4 sm:w-32 sm:pt-5">
              <span style={{ backgroundImage: `linear-gradient(to right, transparent, ${GOLD}80)` }} className="h-px flex-1" />
              <Airplane style={{ color: GOLD }} className="h-3.5 w-3.5 shrink-0 rotate-90" weight="light" aria-hidden="true" />
              <span style={{ backgroundImage: `linear-gradient(to left, transparent, ${GOLD}80)` }} className="h-px flex-1" />
            </div>

            <div className="text-center">
              <p style={{ color: INK }} className="font-editorial text-5xl font-semibold leading-none tracking-tight sm:text-6xl">
                {destinationAirportCode}
              </p>
              {destinationAirportName ? (
                <p style={{ color: TEXT_SECONDARY }} className="mt-2 text-xs font-medium sm:text-sm">
                  {destinationAirportName}
                </p>
              ) : null}
              <p style={{ color: LABEL_MUTED }} className="mt-1.5 text-[10px] uppercase tracking-[0.2em]">
                Destination
              </p>
            </div>
          </div>
          <p style={{ color: INK }} className="mt-9 text-center text-xs font-semibold uppercase tracking-[0.16em] sm:text-sm">
            {formatDate(departureDate)}
            {departureTime ? (
              <span style={{ color: TEXT_SECONDARY }} className="font-normal normal-case tracking-normal">
                {" "}
                · {departureTime} local
              </span>
            ) : null}
          </p>
        </div>

        {/* Perforation — the two notches are clipped by the card's own
            overflow-hidden edge, so only the semicircle "bite" shows,
            regardless of what sits behind the card on the page. The
            notch fill matches the card's own ivory field so it reads
            as a genuine cut rather than a color mismatch. */}
        <div style={{ borderColor: HAIRLINE }} className="relative border-t border-dashed" role="presentation">
          <span
            aria-hidden="true"
            style={{ backgroundColor: IVORY }}
            className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
          />
          <span
            aria-hidden="true"
            style={{ backgroundColor: IVORY }}
            className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
          />
        </div>

        {/* Details + QR */}
        <div className="flex flex-col gap-9 px-6 py-8 sm:flex-row sm:px-10 sm:py-10">
          <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-7">
            <DetailField label="Passenger" value={passengerName} />
            <DetailField
              label="Passengers"
              value={`${passengerCount} ${passengerCount === 1 ? "passenger" : "passengers"}`}
            />
            <div style={{ borderColor: HAIRLINE }} className="col-span-2 border-t" role="presentation" />
            {aircraftName ? <DetailField label="Aircraft" value={aircraftName} /> : null}
            {aircraftRegistration ? (
              <DetailField label="Registration" value={aircraftRegistration} mono />
            ) : null}
            {fboName ? (
              <>
                <div style={{ borderColor: HAIRLINE }} className="col-span-2 border-t" role="presentation" />
                <div className="col-span-2">
                  <dt style={{ color: LABEL_MUTED }} className="text-[10px] font-medium uppercase tracking-[0.16em]">
                    FBO / Terminal
                  </dt>
                  <dd style={{ color: INK }} className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold sm:text-sm">
                    <MapPinLine style={{ color: NAVY_SECONDARY }} className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" weight="light" aria-hidden="true" />
                    <span>
                      {fboName}
                      {fboAddress ? (
                        <span style={{ color: TEXT_SECONDARY }} className="mt-0.5 block text-xs font-normal">
                          {fboAddress}
                        </span>
                      ) : null}
                    </span>
                  </dd>
                </div>
              </>
            ) : null}
          </dl>

          {/* QR code */}
          <div
            style={{ borderColor: HAIRLINE }}
            className="flex shrink-0 flex-col items-center gap-3 border-t pt-7 sm:w-40 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0"
          >
            <p style={{ color: GOLD }} className="text-center text-[9px] font-semibold uppercase tracking-[0.22em]">
              Digital Verification
            </p>
            {/* The QR chip stays pure white (not ivory) — the highest
                contrast against the QR's own black modules is what
                keeps it reliably scannable, on screen and printed. */}
            <div style={{ borderColor: HAIRLINE }} className="rounded-lg border bg-white p-2.5 shadow-crisp">
              {/* eslint-disable-next-line @next/next/no-img-element -- a base64 data URI, next/image can't optimize this and doesn't need to */}
              <img
                src={qrDataUrl}
                alt="QR code that verifies this ticket on the charter verification page"
                className="h-28 w-28 sm:h-32 sm:w-32"
              />
            </div>
            <div className="text-center">
              <p style={{ color: LABEL_MUTED }} className="text-[9px] font-medium uppercase tracking-[0.18em]">
                Scan to Verify
              </p>
              <p style={{ color: LABEL_MUTED }} className="spec-readout mt-1 text-[10px]">
                {ticketNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Security divider */}
        <div aria-hidden="true" role="presentation" className="mx-6 flex items-center gap-3 sm:mx-10">
          <span style={{ backgroundColor: HAIRLINE }} className="h-px flex-1" />
          <span style={{ color: HAIRLINE }} className="tracking-[0.5em] text-[8px]">
            · · · · · · · ·
          </span>
          <span style={{ backgroundColor: HAIRLINE }} className="h-px flex-1" />
        </div>

        {/* Footer */}
        <div className="px-6 py-6 sm:px-10 sm:py-7">
          <div style={{ color: GOLD }} className="flex items-center justify-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em]">
            <SealCheck className="h-3 w-3" weight="fill" aria-hidden="true" />
            Verified Digital Credential
          </div>
          <p style={{ color: INK }} className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.12em]">
            Private Charter Confirmation
          </p>
          <p style={{ color: TEXT_SECONDARY }} className="mx-auto mt-2 max-w-md text-center text-[0.6875rem] leading-relaxed">
            This document confirms your private charter reservation with {companyName}.
            <span className="mt-0.5 block">Please retain it and present it, digitally or printed, when required.</span>
          </p>
          <p style={{ color: LABEL_MUTED }} className="mt-4 text-center text-[0.625rem] uppercase tracking-[0.1em]">
            {companyName} &middot; {contactPhone} &middot; {contactEmail}
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
      <span
        style={{ borderColor: `${GOLD_SOFT}66` }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white/5"
      >
        <Compass style={{ color: GOLD_SOFT }} className="h-4 w-4" aria-hidden="true" />
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
      <dt style={{ color: LABEL_MUTED }} className="text-[10px] font-medium uppercase tracking-[0.16em]">
        {label}
      </dt>
      <dd style={{ color: INK }} className={`mt-1.5 text-xs font-semibold sm:text-sm ${mono ? "spec-readout" : ""}`}>
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
      style={
        isValid
          ? { backgroundColor: PAID_BG, color: PAID_TEXT }
          : { backgroundColor: "#FEF2F2", color: "#B91C1C" }
      }
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]"
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
