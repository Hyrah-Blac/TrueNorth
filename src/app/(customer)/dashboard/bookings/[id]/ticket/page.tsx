import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Ticket as TicketIcon, CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { TicketCard } from "@/components/ticket/TicketCard";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { Button } from "@/components/shared/buttons/Button";
import { WrongAccountNotice } from "@/components/shared/WrongAccountNotice";
import { getMyTicketForBooking } from "@/features/ticket/lib/getTicketForBooking";
import { getTicketVerificationUrl } from "@/features/ticket/lib/ticketVerificationUrl";
import { generateQrCodeDataUrl } from "@/features/ticket/lib/generateQrCode";
import { requireAuth } from "@/middleware/auth";
import { checkUserRateLimit, RATE_LIMITS } from "@/middleware/rate-limit";
import { TICKET_STATUSES } from "@/database/constants/ticket-status";
import { NotFoundError, ForbiddenError, isAppError } from "@/lib/errors/AppError";
import type { AircraftDocument } from "@/database/models/Aircraft";

export const metadata: Metadata = { title: "Your Ticket" };

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingTicketPage({ params }: TicketPageProps) {
  const { id } = await params;

  const { clerkId } = await requireAuth();
  // Same tier as the booking detail page itself — this page does the
  // same kind of per-id lookup, just one level deeper.
  const rateLimit = checkUserRateLimit(clerkId, "ticket-detail", RATE_LIMITS.DETAIL_PAGE_LOOKUP);
  if (!rateLimit.allowed) {
    notFound();
  }

  let owned;
  try {
    owned = await getMyTicketForBooking(id, { includeVerificationToken: true });
  } catch (error) {
    // Same "wrong account" vs. "doesn't exist" distinction used on the
    // booking detail page — see the matching comment there.
    if (isAppError(error) && error instanceof ForbiddenError) {
      return <WrongAccountNotice resourceLabel="ticket" />;
    }
    if (isAppError(error) && error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  const { booking, customer, ticket } = owned;
  // booking.aircraft is typed as ObjectId | AircraftDocument (see
  // BookingWithPopulatedAircraft in getTicketForBooking.ts) because every
  // lookup that produces `owned` calls .populate("aircraft") — this check
  // just narrows that union for TypeScript using the same runtime-safe
  // pattern as the existing booking detail page.
  const aircraft =
    typeof booking.aircraft === "object" ? (booking.aircraft as AircraftDocument) : undefined;

  // The booking is real and belongs to this customer, but no ticket
  // has been issued for it yet — most likely it isn't fully paid.
  // This is a normal, expected state (not an error), so it gets its
  // own explanation rather than a 404.
  if (!ticket) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Button href={`/dashboard/bookings/${booking._id}`} variant="ghost" size="sm" className="-ml-3 gap-1 text-xs text-slate-500 hover:text-navy-900">
          <CaretLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to booking
        </Button>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-14 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <TicketIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="font-display text-lg font-medium text-navy-900">Your ticket isn&apos;t ready yet</h1>
          <p className="max-w-sm text-sm text-slate-600">
            {booking.balanceAmount > 0
              ? "A ticket is issued automatically once your booking is paid in full."
              : "Your booking is fully paid — your ticket is being finalized and will appear here shortly."}
          </p>
        </div>
      </div>
    );
  }

  // ticket.verificationToken was explicitly selected via
  // includeVerificationToken above — this is authenticated, ownership-
  // checked server code, exactly the kind of caller that field exists
  // for (see Ticket.ts and issueTicketForBooking.ts).
  const verificationUrl = getTicketVerificationUrl(ticket.verificationToken);
  const qrDataUrl = await generateQrCodeDataUrl(verificationUrl);

  return (
    <div className="space-y-4">
      <Button href={`/dashboard/bookings/${booking._id}`} variant="ghost" size="sm" className="-ml-3 gap-1 text-xs text-slate-500 hover:text-navy-900">
        <CaretLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to booking
      </Button>

      {ticket.status !== TICKET_STATUSES.ISSUED ? (
        <div className="mx-auto max-w-2xl">
          <InlineAlert tone="error">
            This ticket is {ticket.status} and is no longer valid for travel. Contact us if you believe this is a mistake.
          </InlineAlert>
        </div>
      ) : null}

      <TicketCard
        ticketNumber={ticket.ticketNumber}
        bookingNumber={booking.bookingNumber}
        passengerName={`${customer.firstName} ${customer.lastName}`.trim()}
        departureAirportCode={booking.departureAirportCode}
        destinationAirportCode={booking.destinationAirportCode}
        departureDate={booking.departureDate.toISOString()}
        passengerCount={booking.passengerCount}
        aircraftName={aircraft?.name}
        aircraftRegistration={aircraft?.registration}
        qrDataUrl={qrDataUrl}
        pdfDownloadUrl={`/api/tickets/${ticket._id}/pdf`}
        status={ticket.status}
        departureTime={booking.departureTime}
        fboName={booking.fboName}
        fboAddress={booking.fboAddress}
      />
    </div>
  );
}