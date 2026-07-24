"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/database/connection";
import Aircraft from "@/database/models/Aircraft";
import { requireAdmin } from "@/middleware/admin";
import { resolveDbUserId } from "@/middleware/auth";
import { isAppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logging/logger";
import {
  createAircraftSchema,
  updateAircraftSchema,
  type CreateAircraftInput,
  type UpdateAircraftInput,
} from "@/features/aircraft/schemas/aircraft.schema";
import type { IAircraft } from "@/types/aircraft";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function serialize<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function createAircraft(input: CreateAircraftInput): Promise<ActionResult<IAircraft>> {
  try {
    const session = await requireAdmin();
    const data = createAircraftSchema.parse(input);

    await connectToDatabase();
    const createdBy = await resolveDbUserId(session.clerkId);

    const aircraft = await Aircraft.create({ ...data, createdBy });

    revalidatePath("/admin/aircraft");
    revalidatePath("/fleet");

    return { success: true, data: serialize<IAircraft>(aircraft) };
  } catch (error) {
    logger.error("createAircraft action failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to create aircraft" };
  }
}

export async function updateAircraft(
  aircraftId: string,
  input: UpdateAircraftInput
): Promise<ActionResult<IAircraft>> {
  try {
    await requireAdmin();
    const data = updateAircraftSchema.parse(input);

    await connectToDatabase();

    const aircraft = await Aircraft.findById(aircraftId);
    if (!aircraft) return { success: false, error: "Aircraft not found" };

    Object.assign(aircraft, data);
    await aircraft.save();

    revalidatePath("/admin/aircraft");
    revalidatePath("/fleet");
    revalidatePath(`/fleet/${aircraft.slug}`);

    return { success: true, data: serialize<IAircraft>(aircraft) };
  } catch (error) {
    logger.error("updateAircraft action failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to update aircraft" };
  }
}

export async function deleteAircraft(aircraftId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    await connectToDatabase();

    const aircraft = await Aircraft.findById(aircraftId);
    if (!aircraft) return { success: false, error: "Aircraft not found" };

    await aircraft.softDelete();

    revalidatePath("/admin/aircraft");
    revalidatePath("/fleet");

    return { success: true, data: { id: String(aircraft._id) } };
  } catch (error) {
    logger.error("deleteAircraft action failed", { error: String(error) });
    return { success: false, error: isAppError(error) ? error.message : "Failed to delete aircraft" };
  }
}

export async function getAllAircraftForAdmin(): Promise<IAircraft[]> {
  await requireAdmin();
  await connectToDatabase();

  const items = await Aircraft.find({}).sort({ createdAt: -1 });
  return serialize<IAircraft[]>(items);
}
