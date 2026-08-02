import "server-only";
import connectToDatabase from "@/database/connection";
import Airport from "@/database/models/Airport";

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
  if (params.country) filter.country = { $regex: params.country, $options: "i" };
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
