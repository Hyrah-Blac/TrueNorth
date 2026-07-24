import { z } from "zod";
import { AIRCRAFT_CATEGORY_VALUES, AIRCRAFT_STATUS_VALUES } from "@/database/constants/aircraft";
import type { AircraftCategory, AircraftStatus } from "@/database/constants/aircraft";
import { MISSION_TYPE_VALUES } from "@/database/constants/mission-type";
import type { MissionType } from "@/database/constants/mission-type";

const categoryEnum = z.enum(AIRCRAFT_CATEGORY_VALUES as [AircraftCategory, ...AircraftCategory[]]);
const statusEnum = z.enum(AIRCRAFT_STATUS_VALUES as [AircraftStatus, ...AircraftStatus[]]);
const missionEnum = z.enum(MISSION_TYPE_VALUES as [MissionType, ...MissionType[]]);

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  caption: z.string().max(150).optional(),
});

export const createAircraftSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  category: categoryEnum,
  manufacturer: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  registration: z.string().trim().min(3).max(20),
  tagline: z.string().trim().max(150).optional(),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(3000),
  passengerCapacity: z.number().int().min(1),
  luggageCapacityKg: z.number().min(0),
  rangeNm: z.number().min(0),
  cruisingSpeedKts: z.number().min(0),
  cabinHeightM: z.number().min(0).optional(),
  cabinWidthM: z.number().min(0).optional(),
  cabinLengthM: z.number().min(0).optional(),
  amenities: z.array(z.string().max(60)).max(30).default([]),
  recommendedMissions: z.array(missionEnum).default([]),
  baseAirportCode: z.string().trim().min(3).max(4),
  heroImage: imageSchema.optional(),
  exteriorImages: z.array(imageSchema).default([]),
  interiorImages: z.array(imageSchema).default([]),
  cabinImages: z.array(imageSchema).default([]),
  status: statusEnum.default("active"),
  isFeatured: z.boolean().default(false),
});

export const updateAircraftSchema = createAircraftSchema.partial();

export type CreateAircraftInput = z.infer<typeof createAircraftSchema>;
export type UpdateAircraftInput = z.infer<typeof updateAircraftSchema>;

export const aircraftQuerySchema = z.object({
  category: categoryEnum.optional(),
  minPassengers: z.coerce.number().int().min(1).optional(),
  mission: missionEnum.optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AircraftQuery = z.infer<typeof aircraftQuerySchema>;
