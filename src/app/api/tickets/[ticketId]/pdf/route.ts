import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getMyTicketById } from "@/features/ticket/lib/getTicketForBooking";
import { getTicketVerificationUrl } from "@/features/ticket/lib/ticketVerificationUrl";
import { generateQrCodeDataUrl } from "@/features/ticket/lib/generateQrCode";
import { generateTicketPdf } from "@/features/ticket/lib/generateTicketPdf";
import { getTicketAirportCities } from "@/features/ticket/lib/getTicketAirportNames";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { checkRateLimit, getRequestKey, RATE_LIMITS } from "@/middleware/rate-limit";
import { resolveErrorMessage } from "@/lib/api/response";
import { logger } from "@/lib/logging/logger";
import type { AircraftDocument } from "@/database/models/Aircraft";

interface RouteParams {
  params: Promise<{ ticketId: string }>;
}

/**
 * Streams the ticket PDF for download. Every piece of data in the PDF
 * comes from an authenticated, ownership-checked, server-side
 * database read (getMyTicketById) — never from anything the browser
 * supplies, and the filename is always derived from the server's own
 * ticketNumber, never a client-provided name (see Phase 2 requirement #7).
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { ticketId } = await params;

    const rate = checkRateLimit(getRequestKey(req, "tickets:pdf"), RATE_LIMITS.AUTHENTICATED_READ);
    if (!rate.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again shortly." }, { status: 429 });
    }

    // getMyTicketById itself calls requireAuth/getCurrentUserOrThrow
    // and throws Unauthorized/Forbidden/NotFound as appropriate — see
    // that function for the ownership check this relies on. Its return
    // type guarantees `ticket` is non-null (unlike the booking-page
    // lookup, where no ticket yet is a valid state).
    const { booking, customer, ticket } = await getMyTicketById(ticketId);
    // See the matching comment in the ticket page for why this cast is
    // needed (both members of the ObjectId | AircraftDocument union are
    // "object" at runtime, so `typeof` alone can't narrow it for TS).
    const aircraft =
      typeof booking.aircraft === "object" ? (booking.aircraft as AircraftDocument) : undefined;
    const passengerName = `${customer.firstName} ${customer.lastName}`.trim();

    const verificationUrl = getTicketVerificationUrl(ticket.verificationToken);
    const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);
    const airportCities = await getTicketAirportCities([
      booking.departureAirportCode,
      booking.destinationAirportCode,
    ]);
    // Admin-configured contact info (Settings > General) rather than
    // the hardcoded fallback in site.ts — see generateTicketPdf's
    // companyName/contactPhone/contactEmail fields.
    const settings = await getSiteSettings();

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateTicketPdf({
        ticketNumber: ticket.ticketNumber,
        bookingNumber: booking.bookingNumber,
        passengerName,
        departureAirportCode: booking.departureAirportCode,
        destinationAirportCode: booking.destinationAirportCode,
        departureDate: booking.departureDate,
        passengerCount: booking.passengerCount,
        aircraftName: aircraft?.name,
        aircraftRegistration: aircraft?.registration,
        qrCodeDataUrl,
        verificationUrl,
        status: ticket.status,
        departureTime: booking.departureTime,
        fboName: booking.fboName,
        fboAddress: booking.fboAddress,
        departureAirportName: airportCities[booking.departureAirportCode],
        destinationAirportName: airportCities[booking.destinationAirportCode],
        companyName: settings.companyName,
        contactPhone: settings.phone,
        contactEmail: settings.email,
      });
    } catch (pdfError) {
      // A PDF-rendering failure is a genuine server error, not a
      // client mistake — log it loudly and return a generic 500
      // rather than a stack trace (Phase 2 requirement #18).
      logger.error("Ticket PDF generation failed", {
        ticketId: String(ticket._id),
        ticketNumber: ticket.ticketNumber,
        error: String(pdfError),
      });
      return NextResponse.json({ success: false, error: "Could not generate the ticket PDF" }, { status: 500 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // The filename is always the server's own ticketNumber — a
        // client can't influence this via the URL or any request body.
        "Content-Disposition": `attachment; filename="${ticket.ticketNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const { message, status } = resolveErrorMessage(error, "GET /api/tickets/[ticketId]/pdf");
    return NextResponse.json({ success: false, error: message }, { status });
  }
}