import "server-only";
import connectToDatabase from "@/database/connection";
import Airport from "@/database/models/Airport";
import { escapeRegExp } from "@/utils/validators";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AirportSummary {
  _id: string;
  icao: string;
  iata?: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  runwayLengthM?: number;
  runwaySurface?: string;
  elevationFt?: number;
  fuelAvailable: boolean;
  nightOperations: boolean;
  customsAvailable: boolean;
  medicalSupport: boolean;
  /** Truncated to 300 chars to keep prompt size manageable. */
  notes?: string;
}

export interface AirportSearchParams {
  query?: string;
  country?: string;
  minRunwayLengthM?: number;
  fuelAvailable?: boolean;
  nightOperations?: boolean;
  customsAvailable?: boolean;
  limit?: number;
}

// Projection — excludes status, isFeatured, timestamps (not relevant to AI)
const AI_PROJECTION = {
  icao: 1,
  iata: 1,
  name: 1,
  city: 1,
  country: 1,
  latitude: 1,
  longitude: 1,
  runwayLengthM: 1,
  runwaySurface: 1,
  elevationFt: 1,
  fuelAvailable: 1,
  nightOperations: 1,
  customsAvailable: 1,
  medicalSupport: 1,
  notes: 1,
} as const;

const MAX_NOTES_CHARS = 300;

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Full-text and filter search over the active airport database.
 * Returns plain objects safe for prompt injection.
 */
export async function searchAirportsForAI(
  params: AirportSearchParams = {}
): Promise<AirportSummary[]> {
  await connectToDatabase();

  const filter: Record<string, unknown> = { status: "active" };

  if (params.query) filter.$text = { $search: params.query };
  // Escaped before use — this filter is reachable from the public,
  // unauthenticated AI chat endpoint, and the model's tool-call args
  // are only trimmed/truncated (see executor.ts's safeString), not
  // regex-escaped. Without this, a crafted value like `(a+)+$` would
  // reach Mongo as a live regex — a ReDoS vector — the same way an
  // unescaped admin search box would (see escapeRegExp's docstring).
  if (params.country) filter.country = { $regex: escapeRegExp(params.country), $options: "i" };
  if (params.minRunwayLengthM !== undefined && params.minRunwayLengthM > 0) {
    filter.runwayLengthM = { $gte: params.minRunwayLengthM };
  }
  if (params.fuelAvailable === true) filter.fuelAvailable = true;
  if (params.nightOperations === true) filter.nightOperations = true;
  if (params.customsAvailable === true) filter.customsAvailable = true;

  const limit = Math.min(params.limit ?? 5, 10);

  const items = await Airport.find(filter, AI_PROJECTION)
    .sort({ isFeatured: -1, name: 1 })
    .limit(limit)
    .lean();

  return items.map(toAirportSummary);
}

/** Look up a single airport by ICAO code, IATA code, or MongoDB ObjectId. */
export async function getAirportByCodeForAI(code: string): Promise<AirportSummary | null> {
  await connectToDatabase();

  const { OBJECT_ID_REGEX } = await import("@/utils/validators");
  const upper = code.toUpperCase().trim();

  const filter: Record<string, unknown> = { status: "active" };

  if (OBJECT_ID_REGEX.test(code)) {
    filter._id = code;
  } else if (upper.length === 4) {
    filter.icao = upper;
  } else if (upper.length === 3) {
    filter.iata = upper;
  } else {
    // Neither a valid code nor an ObjectId — fall back to name search
    filter.$text = { $search: code };
  }

  const airport = await Airport.findOne(filter, AI_PROJECTION).lean();
  return airport ? toAirportSummary(airport) : null;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two coordinates, in kilometres. */
function haversineDistanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Finds real airports near a known reference airport, by actual
 * coordinate distance — used when a requested airport can't handle a
 * flight (e.g. runway too short, or the visitor asks for alternatives)
 * so the concierge can offer genuine nearby options instead of just
 * saying no. Returns [] (never a fabricated list) if the reference
 * airport itself isn't found.
 */
export async function findNearbyAirportsForAI(
  referenceCode: string,
  radiusKm = 150,
  limit = 5
): Promise<AirportSummary[]> {
  await connectToDatabase();

  const reference = await getAirportByCodeForAI(referenceCode);
  if (!reference) return [];

  const candidates = await Airport.find(
    { status: "active", _id: { $ne: reference._id } },
    AI_PROJECTION
  ).lean();

  return candidates
    .map((doc) => ({ summary: toAirportSummary(doc), distanceKm: haversineDistanceKm(reference, doc as unknown as { latitude: number; longitude: number }) }))
    .filter((entry) => entry.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
    .map((entry) => entry.summary);
}

// ── Mapping ───────────────────────────────────────────────────────────────────

function toAirportSummary(a: Record<string, unknown>): AirportSummary {
  const notes = a.notes as string | undefined;

  return {
    _id: String(a._id),
    icao: String(a.icao),
    iata: a.iata as string | undefined,
    name: String(a.name),
    city: String(a.city),
    country: String(a.country),
    latitude: Number(a.latitude),
    longitude: Number(a.longitude),
    runwayLengthM: a.runwayLengthM as number | undefined,
    runwaySurface: a.runwaySurface as string | undefined,
    elevationFt: a.elevationFt as number | undefined,
    fuelAvailable: Boolean(a.fuelAvailable),
    nightOperations: Boolean(a.nightOperations),
    customsAvailable: Boolean(a.customsAvailable),
    medicalSupport: Boolean(a.medicalSupport),
    notes:
      notes && notes.length > MAX_NOTES_CHARS
        ? `${notes.slice(0, MAX_NOTES_CHARS).trimEnd()}…`
        : notes,
  };
}