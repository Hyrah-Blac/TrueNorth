"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/database/connection";
import Airport from "@/database/models/Airport";
import { requireAdmin } from "@/middleware/admin";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import {
  createAirportSchema,
  updateAirportSchema,
  type CreateAirportInput,
  type UpdateAirportInput,
} from "@/features/airport/schemas/airport.schema";
import type { IAirport } from "@/types/airport";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function createAirport(input: CreateAirportInput): Promise<ActionResult<IAirport>> {
  try {
    await requireAdmin();
    const data = createAirportSchema.parse(input);

    await connectToDatabase();

    const airport = await Airport.create({
      ...data,
      iata: data.iata || undefined,
    });

    revalidatePath("/admin/airports");

    return { success: true, data: serialize<IAirport>(airport) };
  } catch (error) {
    logger.error("createAirport action failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to create airport" };
  }
}

export async function updateAirport(
  airportId: string,
  input: UpdateAirportInput
): Promise<ActionResult<IAirport>> {
  try {
    await requireAdmin();
    const data = updateAirportSchema.parse(input);

    await connectToDatabase();

    const airport = await Airport.findById(airportId);
    if (!airport) return { success: false, error: "Airport not found" };

    Object.assign(airport, {
      ...data,
      iata: data.iata || undefined,
    });
    await airport.save();

    revalidatePath("/admin/airports");

    return { success: true, data: serialize<IAirport>(airport) };
  } catch (error) {
    logger.error("updateAirport action failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to update airport" };
  }
}

export async function deleteAirport(airportId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    await connectToDatabase();

    const airport = await Airport.findByIdAndDelete(airportId);
    if (!airport) return { success: false, error: "Airport not found" };

    revalidatePath("/admin/airports");

    return { success: true, data: { id: String(airport._id) } };
  } catch (error) {
    logger.error("deleteAirport action failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to delete airport" };
  }
}

export interface AirportListResult {
  airports: IAirport[];
  total: number;
  totalPages: number;
  page: number;
}

export async function getAirportsForAdmin(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  country?: string;
} = {}): Promise<AirportListResult> {
  await requireAdmin();
  await connectToDatabase();

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (params.status && params.status !== "all") filter.status = params.status;
  if (params.country) filter.country = params.country;
  if (params.search) filter.$text = { $search: params.search };

  const [items, total] = await Promise.all([
    Airport.find(filter).sort({ isFeatured: -1, name: 1 }).skip(skip).limit(limit),
    Airport.countDocuments(filter),
  ]);

  return {
    airports: serialize<IAirport[]>(items),
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    page,
  };
}

export async function getAirportById(id: string): Promise<IAirport | null> {
  await requireAdmin();
  await connectToDatabase();

  const airport = await Airport.findById(id);
  if (!airport) return null;
  return serialize<IAirport>(airport);
}
