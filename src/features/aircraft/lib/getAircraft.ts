import "server-only";
import connectToDatabase from "@/database/connection";
import Aircraft from "@/database/models/Aircraft";
import { AIRCRAFT_STATUSES, AIRCRAFT_CATEGORY_VALUES } from "@/database/constants/aircraft";
import { OBJECT_ID_REGEX } from "@/utils/validators";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/utils/pagination";
import type { AircraftCategory } from "@/database/constants/aircraft";
import type { MissionType } from "@/database/constants/mission-type";
import type { IAircraft } from "@/types/aircraft";

export interface FleetPageFilters {
  category?: AircraftCategory;
  minPassengers?: number;
  mission?: MissionType;
  search?: string;
  page?: number;
  limit?: number;
}

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function getAircraftList(
  filters: FleetPageFilters
): Promise<{ items: IAircraft[]; total: number; page: number; limit: number }> {
  await connectToDatabase();

  const page = filters.page && filters.page > 0 ? filters.page : DEFAULT_PAGE;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : DEFAULT_PAGE_SIZE;

  const query: Record<string, unknown> = { status: AIRCRAFT_STATUSES.ACTIVE };
  if (filters.category) query.category = filters.category;
  if (filters.minPassengers) query.passengerCapacity = { $gte: filters.minPassengers };
  if (filters.mission) query.recommendedMissions = filters.mission;
  if (filters.search) query.$text = { $search: filters.search };

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Aircraft.find(query).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit),
    Aircraft.countDocuments(query),
  ]);

  return { items: serialize<IAircraft[]>(items), total, page, limit };
}

export interface FleetFilterCounts {
  total: number;
  categoryCounts: Record<AircraftCategory, number>;
  passengerCounts: Record<"4" | "8" | "12", number>;
}

/**
 * Counts backing the fleet filter bar, so unavailable options can be greyed
 * out instead of letting the user land on a dead-end "no results" screen.
 *
 * Each dimension is counted against the *other* active filter, not its own:
 * category counts respect the current passenger filter (and vice versa), so
 * a chip only greys out when it would produce zero results in combination
 * with whatever else is currently selected — not on its own in isolation.
 */
export async function getAircraftFilterCounts(
  filters: { category?: AircraftCategory; minPassengers?: number } = {}
): Promise<FleetFilterCounts> {
  await connectToDatabase();

  const baseMatch: Record<string, unknown> = { status: AIRCRAFT_STATUSES.ACTIVE };

  const categoryMatch: Record<string, unknown> = { ...baseMatch };
  if (filters.minPassengers) categoryMatch.passengerCapacity = { $gte: filters.minPassengers };

  const passengerMatch: Record<string, unknown> = { ...baseMatch };
  if (filters.category) passengerMatch.category = filters.category;

  const [categoryAgg, total, p4, p8, p12] = await Promise.all([
    Aircraft.aggregate<{ _id: AircraftCategory; count: number }>([
      { $match: categoryMatch },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Aircraft.countDocuments(baseMatch),
    Aircraft.countDocuments({ ...passengerMatch, passengerCapacity: { $gte: 4 } }),
    Aircraft.countDocuments({ ...passengerMatch, passengerCapacity: { $gte: 8 } }),
    Aircraft.countDocuments({ ...passengerMatch, passengerCapacity: { $gte: 12 } }),
  ]);

  const categoryCounts = AIRCRAFT_CATEGORY_VALUES.reduce(
    (acc, category) => {
      acc[category] = categoryAgg.find((row) => row._id === category)?.count ?? 0;
      return acc;
    },
    {} as Record<AircraftCategory, number>
  );

  return {
    total,
    categoryCounts,
    passengerCounts: { "4": p4, "8": p8, "12": p12 },
  };
}

export interface AircraftOptionResult {
  _id: string;
  name: string;
  category: AircraftCategory;
}

/** Lightweight list for <select> dropdowns (charter request form, admin quote review). */
export async function getAircraftOptions(): Promise<AircraftOptionResult[]> {
  await connectToDatabase();

  const items = await Aircraft.find({ status: AIRCRAFT_STATUSES.ACTIVE })
    .select("_id name category")
    .sort({ name: 1 });

  return serialize<AircraftOptionResult[]>(items);
}

export async function getAircraftByIdOrSlug(idOrSlug: string): Promise<IAircraft | null> {
  await connectToDatabase();

  const query = OBJECT_ID_REGEX.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const aircraft = await Aircraft.findOne({
    ...query,
    status: AIRCRAFT_STATUSES.ACTIVE,
  });

  return aircraft ? serialize<IAircraft>(aircraft) : null;
}

export async function getFeaturedAircraft(limit = 6): Promise<IAircraft[]> {
  await connectToDatabase();

  const items = await Aircraft.find({
    isFeatured: true,
    status: AIRCRAFT_STATUSES.ACTIVE,
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  return serialize<IAircraft[]>(items);
}

/** Same category, excluding the current aircraft — for a detail page's "related aircraft" section. */
export async function getRelatedAircraft(
  category: AircraftCategory,
  excludeId: string,
  limit = 3
): Promise<IAircraft[]> {
  await connectToDatabase();

  const items = await Aircraft.find({
    category,
    status: AIRCRAFT_STATUSES.ACTIVE,
    _id: { $ne: excludeId },
  }).limit(limit);

  return serialize<IAircraft[]>(items);
}