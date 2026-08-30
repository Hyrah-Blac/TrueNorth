import "server-only";
import connectToDatabase from "@/database/connection";
import Airport from "@/database/models/Airport";

/**
 * Looks up the real airport name for a set of airport codes so the
 * ticket can show "Jomo Kenyatta International Airport" under "NBO"
 * the same way a real charter confirmation would, without ever
 * inventing a location. Deliberately the airport *name*, not the
 * city — two airports can share a city (e.g. NBO and WIL are both
 * Nairobi), which would make the two sides of the Journey section
 * read identically and defeat the point of the caption. Airports that
 * aren't in the Airport collection (or have no name set) are simply
 * left out of the returned map — the caller renders the code alone in
 * that case rather than guessing (see Phase 6 requirement #7).
 *
 * Matches on ICAO or IATA — booking.departureAirportCode /
 * destinationAirportCode can be either (e.g. "NBO" is Jomo Kenyatta's
 * 3-letter IATA code, not its 4-letter ICAO code "HKJK") — mirroring
 * getAirportNamesByCodes (lib/api/airportNames.ts), the lookup used
 * everywhere else airport names are resolved on the site. Matching
 * only on `icao` here previously meant IATA-coded bookings silently
 * got no name on the ticket, even though the same airport resolved
 * correctly everywhere else.
 *
 * A plain code -> name lookup map, not a fuller AirportSummary, is
 * deliberate: the ticket only ever needs this one line, and it keeps
 * the query and the two ticket-rendering call sites (the ticket page,
 * the PDF route) simple.
 */
export async function getTicketAirportNames(codes: (string | undefined)[]): Promise<Record<string, string>> {
  const uniqueCodes = Array.from(
    new Set(codes.filter((code): code is string => Boolean(code)).map((code) => code.toUpperCase()))
  );
  if (uniqueCodes.length === 0) return {};

  await connectToDatabase();
  const airports = await Airport.find(
    { $or: [{ icao: { $in: uniqueCodes } }, { iata: { $in: uniqueCodes } }] },
    { icao: 1, iata: 1, name: 1 }
  );

  const map: Record<string, string> = {};
  for (const airport of airports) {
    if (airport.icao) map[airport.icao.toUpperCase()] = airport.name;
    if (airport.iata) map[airport.iata.toUpperCase()] = airport.name;
  }
  return map;
}