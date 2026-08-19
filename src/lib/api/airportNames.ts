import "server-only";
import connectToDatabase from "@/database/connection";
import Airport from "@/database/models/Airport";

export interface AirportNameInfo {
  name: string;
  city: string;
}

/**
 * Resolves a small set of ICAO/IATA airport codes to their display name +
 * city, for customer-facing pages that only store the raw code (e.g. a
 * quote's departure/destination airport). Read-only, single lean query —
 * codes that don't match any airport are simply absent from the returned
 * map, so callers should fall back to the raw code rather than guessing.
 */
export async function getAirportNamesByCodes(codes: string[]): Promise<Record<string, AirportNameInfo>> {
  const upperCodes = Array.from(new Set(codes.map((code) => code.toUpperCase().trim()).filter(Boolean)));
  if (upperCodes.length === 0) return {};

  await connectToDatabase();

  const airports = await Airport.find(
    { $or: [{ icao: { $in: upperCodes } }, { iata: { $in: upperCodes } }] },
    { icao: 1, iata: 1, name: 1, city: 1 }
  ).lean<{ icao: string; iata?: string; name: string; city: string }[]>();

  const map: Record<string, AirportNameInfo> = {};
  for (const airport of airports) {
    const info: AirportNameInfo = { name: airport.name, city: airport.city };
    if (airport.icao) map[airport.icao.toUpperCase()] = info;
    if (airport.iata) map[airport.iata.toUpperCase()] = info;
  }
  return map;
}