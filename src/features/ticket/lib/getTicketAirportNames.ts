import "server-only";
import connectToDatabase from "@/database/connection";
import Airport from "@/database/models/Airport";

/**
 * Looks up the real city for a set of ICAO codes (booking.departureAirportCode /
 * destinationAirportCode are always the 4-letter ICAO code — see Booking.ts),
 * so the ticket can show "Emae" under "FZFE" the same way a real charter
 * confirmation would, without ever inventing a location. Airports that
 * aren't in the Airport collection (or the field is missing) are simply
 * left out of the returned map — the caller renders the code alone in
 * that case rather than guessing (see Phase 6 requirement #7).
 *
 * A plain code -> city lookup map, not a fuller AirportSummary, is
 * deliberate: the ticket only ever needs the city line, and this keeps
 * the query and the two ticket-rendering call sites (the ticket page,
 * the PDF route) simple.
 */
export async function getTicketAirportCities(codes: (string | undefined)[]): Promise<Record<string, string>> {
  const uniqueCodes = Array.from(
    new Set(codes.filter((code): code is string => Boolean(code)).map((code) => code.toUpperCase()))
  );
  if (uniqueCodes.length === 0) return {};

  await connectToDatabase();
  const airports = await Airport.find({ icao: { $in: uniqueCodes } }, { icao: 1, city: 1 });

  return Object.fromEntries(airports.map((airport) => [airport.icao, airport.city]));
}
