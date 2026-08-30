import { z } from "zod";
import {
  RUNWAY_SURFACE_VALUES,
  AIRPORT_STATUS_VALUES,
  type RunwaySurface,
  type AirportStatus,
} from "@/database/constants/airport";

const runwaySurfaceEnum = z.enum(RUNWAY_SURFACE_VALUES as [RunwaySurface, ...RunwaySurface[]]);
const statusEnum = z.enum(AIRPORT_STATUS_VALUES as [AirportStatus, ...AirportStatus[]]);

export const createAirportSchema = z.object({
  icao: z
    .string()
    .trim()
    .toUpperCase()
    .length(4, "ICAO code must be exactly 4 characters")
    .regex(/^[A-Z]{4}$/, "ICAO code must be 4 uppercase letters"),
  iata: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "IATA code must be exactly 3 characters")
    .regex(/^[A-Z]{3}$/, "IATA code must be 3 uppercase letters")
    .optional()
    .or(z.literal("")),
  name: z.string().trim().min(2, "Airport name is required").max(150),
  country: z.string().trim().min(1, "Country is required").max(100),
  city: z.string().trim().min(1, "City is required").max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  runwayLengthM: z.number().min(0).optional(),
  runwaySurface: runwaySurfaceEnum.optional(),
  elevationFt: z.number().optional(),
  fuelAvailable: z.boolean().default(false),
  nightOperations: z.boolean().default(false),
  customsAvailable: z.boolean().default(false),
  medicalSupport: z.boolean().default(false),
  notes: z.string().trim().max(2000).optional(),
  status: statusEnum.default("active"),
  isFeatured: z.boolean().default(false),
});

export const updateAirportSchema = createAirportSchema.partial();

export type CreateAirportInput = z.infer<typeof createAirportSchema>;
export type UpdateAirportInput = z.infer<typeof updateAirportSchema>;

export const airportQuerySchema = z.object({
  status: statusEnum.optional(),
  country: z.string().trim().max(100).optional(),
  runwaySurface: runwaySurfaceEnum.optional(),
  fuelAvailable: z.coerce.boolean().optional(),
  nightOperations: z.coerce.boolean().optional(),
  customsAvailable: z.coerce.boolean().optional(),
  search: z.string().trim().max(100).optional(),
  /**
   * Comma-separated ICAO/IATA codes, e.g. "NBO,MYD" — when present the
   * route skips the paginated list/search below entirely and instead
   * returns a { CODE: { name, city } } lookup map for just those
   * codes. Used by client components (e.g. the fleet comparison page)
   * that already have an aircraft's raw baseAirportCode and need its
   * display name without a server component's direct DB access.
   */
  codes: z.string().trim().max(500).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AirportQuery = z.infer<typeof airportQuerySchema>;
