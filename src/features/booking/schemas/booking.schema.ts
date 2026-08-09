import { z } from "zod";
import { BOOKING_STATUS_VALUES } from "@/database/constants/booking-status";
import type { BookingStatus } from "@/database/constants/booking-status";
import { OBJECT_ID_REGEX } from "@/utils/validators";

const statusEnum = z.enum(BOOKING_STATUS_VALUES as [BookingStatus, ...BookingStatus[]]);
const objectId = z.string().regex(OBJECT_ID_REGEX, "Invalid ID");

export const createBookingSchema = z.object({
  customerId: objectId,
  aircraftId: objectId,
  quoteId: objectId.optional(),
  passengerCount: z.number().int().min(1).max(100),
  departureAirportCode: z.string().trim().min(3).max(4),
  destinationAirportCode: z.string().trim().min(3).max(4),
  departureDate: z.coerce.date(),
  returnDate: z.coerce.date().optional(),
  isRoundTrip: z.boolean().default(false),
  missionType: z.string().min(1),
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

export const bookingQuerySchema = z.object({
  status: statusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type BookingQuery = z.infer<typeof bookingQuerySchema>;