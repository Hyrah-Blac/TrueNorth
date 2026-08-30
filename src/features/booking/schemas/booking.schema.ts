import { z } from "zod";
import { BOOKING_STATUS_VALUES } from "@/database/constants/booking-status";
import type { BookingStatus } from "@/database/constants/booking-status";
import { CHARTER_TYPE_VALUES, CHARTER_TYPES } from "@/database/constants/charter-type";
import type { CharterType } from "@/database/constants/charter-type";
import { OBJECT_ID_REGEX, LOCAL_TIME_REGEX } from "@/utils/validators";

const statusEnum = z.enum(BOOKING_STATUS_VALUES as [BookingStatus, ...BookingStatus[]]);
const charterTypeEnum = z.enum(CHARTER_TYPE_VALUES as [CharterType, ...CharterType[]]);
const objectId = z.string().regex(OBJECT_ID_REGEX, "Invalid ID");

export const createBookingSchema = z.object({
  customerId: objectId,
  aircraftId: objectId,
  quoteId: objectId.optional(),
  passengerCount: z.number().int().min(1).max(100),
  departureAirportCode: z.string().trim().min(3).max(4),
  destinationAirportCode: z.string().trim().min(3).max(4),
  departureDate: z.coerce.date(),
  departureTime: z
    .string()
    .trim()
    .regex(LOCAL_TIME_REGEX, "Enter a valid 24-hour time, e.g. 09:30")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  returnDate: z.coerce.date().optional(),
  isRoundTrip: z.boolean().default(false),
  missionType: z.string().min(1),
  // Defaults to exclusive — an admin creating a booking directly must
  // explicitly opt into sharing the aircraft with other customers.
  charterType: charterTypeEnum.default(CHARTER_TYPES.EXCLUSIVE),
  totalAmount: z.number().min(1),
  currency: z.string().trim().length(3).default("KES"),
  specialRequests: z.string().trim().max(2000).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: statusEnum,
  note: z.string().trim().max(500).optional(),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

export const cancelBookingSchema = z.object({
  cancellationReason: z.string().trim().min(5, "Please provide a reason").max(1000),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const requestModificationSchema = z.object({
  modificationNotes: z.string().trim().min(5).max(1000),
});

// Day-of-travel logistics — every field optional since ops may only
// know some of these at first and fill the rest in later. Empty
// strings are normalized to undefined so "clearing" a field back out
// works the same as never having set it.
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

// Matches the native <input type="time"> value format exactly
// (24-hour "HH:MM", e.g. "09:30" or "17:05") — see
// BookingTripDetailsActions.tsx, which now uses that input type
// instead of free text specifically so this can never mismatch what
// the browser actually sends. Normally this field arrives already
// set — it's collected once, up front, when the admin approves the
// quote (see approveQuoteSchema) — this dialog exists for the cases
// that need adjusting or backfilling afterwards.
const optionalTime = () =>
  z
    .string()
    .trim()
    .regex(LOCAL_TIME_REGEX, "Enter a valid 24-hour time, e.g. 09:30")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

export const updateBookingTripDetailsSchema = z.object({
  departureTime: optionalTime(),
  fboName: optionalTrimmed(200),
  fboAddress: optionalTrimmed(300),
  groundContactPhone: optionalTrimmed(30),
});

export type UpdateBookingTripDetailsInput = z.infer<typeof updateBookingTripDetailsSchema>;

export const bookingQuerySchema = z.object({
  status: statusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type BookingQuery = z.infer<typeof bookingQuerySchema>;