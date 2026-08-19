import "server-only";
import connectToDatabase from "@/database/connection";
import Aircraft from "@/database/models/Aircraft";
import { AIRCRAFT_STATUSES } from "@/database/constants/aircraft";
import { escapeRegExp } from "@/utils/validators";
import type { MissionType } from "@/database/constants/mission-type";
import type { AircraftCategory } from "@/database/constants/aircraft";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AircraftSearchParams {
  passengerCount?: number;
  missionType?: MissionType;
  category?: AircraftCategory;
  minRangeNm?: number;
  petFriendly?: boolean;
  wifiAvailable?: boolean;
  shortRunwayCapable?: boolean;
  region?: string;
  limit?: number;
}

export interface AircraftSummary {
  _id: string;
  name: string;
  slug: string;
  category: string;
  manufacturer: string;
  model: string;
  passengerCapacity: number;
  rangeNm: number;
  cruisingSpeedKts: number;
  luggageCapacityKg: number;
  amenities: string[];
  recommendedMissions: string[];
  baseAirportCode: string;
  heroImageUrl?: string;
  luxuryLevel?: number;
  executiveRating?: number;
  petFriendly?: boolean;
  wifiAvailable?: boolean;
  shortRunwayCapable?: boolean;
  baggageFlexibility?: string;
  aiStrengths: string[];
  aiLimitations: string[];
  aiNotes?: string;
  recommendedMissionTypes: string[];
  recommendedPassengerRange?: { min: number; max: number };
  recommendedFlightRange?: { minNm: number; maxNm: number };
  operatingRegions: string[];
  tagline?: string;
  /** Truncated to 300 chars to keep prompt size manageable. */
  description: string;
}

// Fields returned to the AI — excludes images array, full description,
// and other large fields not useful for recommendations.
const AI_PROJECTION = {
  name: 1,
  slug: 1,
  category: 1,
  manufacturer: 1,
  model: 1,
  passengerCapacity: 1,
  rangeNm: 1,
  cruisingSpeedKts: 1,
  luggageCapacityKg: 1,
  amenities: 1,
  recommendedMissions: 1,
  baseAirportCode: 1,
  "heroImage.url": 1,
  luxuryLevel: 1,
  executiveRating: 1,
  petFriendly: 1,
  wifiAvailable: 1,
  shortRunwayCapable: 1,
  baggageFlexibility: 1,
  aiStrengths: 1,
  aiLimitations: 1,
  aiNotes: 1,
  recommendedMissionTypes: 1,
  recommendedPassengerRange: 1,
  recommendedFlightRange: 1,
  operatingRegions: 1,
  tagline: 1,
  description: 1,
} as const;

const MAX_DESCRIPTION_CHARS = 300;

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Searches the active fleet for aircraft matching the given filters.
 * Returns lightweight summaries safe for JSON serialisation and prompt
 * injection — never raw Mongoose documents.
 */
export async function searchAircraftForAI(
  params: AircraftSearchParams = {}
): Promise<AircraftSummary[]> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {
    status: AIRCRAFT_STATUSES.ACTIVE,
    isDeleted: { $ne: true },
  };

  if (params.passengerCount !== undefined && params.passengerCount > 0) {
    filter.passengerCapacity = { $gte: params.passengerCount };
  }
  if (params.category) {
    filter.category = params.category;
  }
  if (params.missionType) {
    filter.$or = [
      { recommendedMissions: params.missionType },
      { recommendedMissionTypes: params.missionType },
    ];
  }
  if (params.minRangeNm !== undefined && params.minRangeNm > 0) {
    filter.rangeNm = { $gte: params.minRangeNm };
  }
  if (params.petFriendly === true) filter.petFriendly = true;
  if (params.wifiAvailable === true) filter.wifiAvailable = true;
  if (params.shortRunwayCapable === true) filter.shortRunwayCapable = true;
  if (params.region) {
    // Escaped before use — same reasoning as searchAirportsForAI's
    // `country` filter: this is reachable from the public,
    // unauthenticated AI chat endpoint, and tool-call args are only
    // trimmed/truncated (see executor.ts's safeString), not
    // regex-escaped. Without this, a crafted value would reach Mongo
    // as a live regex — a ReDoS vector.
    filter.operatingRegions = { $regex: escapeRegExp(params.region), $options: "i" };
  }

  const limit = Math.min(params.limit ?? 5, 10);

  const items = await Aircraft.find(filter, AI_PROJECTION)
    .sort({ isFeatured: -1, executiveRating: -1, passengerCapacity: 1 })
    .limit(limit)
    .lean();

  return items.map(toAircraftSummary);
}

/** Single aircraft by ID or slug for detailed AI responses. */
export async function getAircraftDetailForAI(
  idOrSlug: string
): Promise<AircraftSummary | null> {
  await connectToDatabase();

  const { OBJECT_ID_REGEX } = await import("@/utils/validators");
  const query = OBJECT_ID_REGEX.test(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };

  const a = await Aircraft.findOne(
    { ...query, status: AIRCRAFT_STATUSES.ACTIVE, isDeleted: { $ne: true } },
    AI_PROJECTION
  ).lean();

  return a ? toAircraftSummary(a) : null;
}

// ── Mapping ───────────────────────────────────────────────────────────────────

function toAircraftSummary(a: Record<string, unknown>): AircraftSummary {
  const heroImage = a.heroImage as { url?: string } | undefined;
  const desc = String(a.description ?? "");

  return {
    _id: String(a._id),
    name: String(a.name),
    slug: String(a.slug),
    category: String(a.category),
    manufacturer: String(a.manufacturer),
    model: String(a.model),
    passengerCapacity: Number(a.passengerCapacity),
    rangeNm: Number(a.rangeNm),
    cruisingSpeedKts: Number(a.cruisingSpeedKts),
    luggageCapacityKg: Number(a.luggageCapacityKg),
    amenities: (a.amenities as string[]) ?? [],
    recommendedMissions: (a.recommendedMissions as string[]) ?? [],
    baseAirportCode: String(a.baseAirportCode),
    heroImageUrl: heroImage?.url,
    luxuryLevel: a.luxuryLevel as number | undefined,
    executiveRating: a.executiveRating as number | undefined,
    petFriendly: a.petFriendly as boolean | undefined,
    wifiAvailable: a.wifiAvailable as boolean | undefined,
    shortRunwayCapable: a.shortRunwayCapable as boolean | undefined,
    baggageFlexibility: a.baggageFlexibility as string | undefined,
    aiStrengths: (a.aiStrengths as string[]) ?? [],
    aiLimitations: (a.aiLimitations as string[]) ?? [],
    aiNotes: a.aiNotes as string | undefined,
    recommendedMissionTypes: (a.recommendedMissionTypes as string[]) ?? [],
    recommendedPassengerRange: a.recommendedPassengerRange as
      | { min: number; max: number }
      | undefined,
    recommendedFlightRange: a.recommendedFlightRange as
      | { minNm: number; maxNm: number }
      | undefined,
    operatingRegions: (a.operatingRegions as string[]) ?? [],
    tagline: a.tagline as string | undefined,
    description:
      desc.length > MAX_DESCRIPTION_CHARS
        ? `${desc.slice(0, MAX_DESCRIPTION_CHARS).trimEnd()}…`
        : desc,
  };
}