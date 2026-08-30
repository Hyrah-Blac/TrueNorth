import { z } from "zod";
import { MISSION_TYPE_VALUES } from "@/database/constants/mission-type";
import type { MissionType } from "@/database/constants/mission-type";
import { QUOTE_STATUS_VALUES } from "@/database/constants/quote-status";
import type { QuoteStatus } from "@/database/constants/quote-status";
import { DEPARTURE_TIME_PREFERENCE_VALUES } from "@/database/constants/departure-time-preference";
import type { DepartureTimePreference } from "@/database/constants/departure-time-preference";
import { CHARTER_TYPE_VALUES, CHARTER_TYPES } from "@/database/constants/charter-type";
import type { CharterType } from "@/database/constants/charter-type";
import { GENERAL_PHONE_REGEX, OBJECT_ID_REGEX, LOCAL_TIME_REGEX } from "@/utils/validators";

const missionEnum = z.enum(MISSION_TYPE_VALUES as [MissionType, ...MissionType[]]);
const statusEnum = z.enum(QUOTE_STATUS_VALUES as [QuoteStatus, ...QuoteStatus[]]);
const charterTypeEnum = z.enum(CHARTER_TYPE_VALUES as [CharterType, ...CharterType[]]);
const objectId = z.string().regex(OBJECT_ID_REGEX, "Invalid ID");

// Phone numbers are naturally typed/pasted with spaces or dashes
// (e.g. "+254 708 892 669"). Strip those before testing against
// GENERAL_PHONE_REGEX, which only accepts a leading "+" and digits —
// otherwise every normally-formatted number gets rejected.
const phoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(GENERAL_PHONE_REGEX, "Enter a valid phone number"));

// Matches the native <input type="time"> value format exactly
// (24-hour "HH:MM", e.g. "09:30") — see ApproveQuoteDialog.tsx, which
// uses that input type. Collecting this alongside the aircraft at
// approval means the customer's ticket already has a departure time
// the moment they pay, instead of it only being added by ops
// afterwards (see BookingTripDetailsActions.tsx, which now exists for
// adjustments rather than first entry).
const optionalTime = () =>
  z
    .string()
    .trim()
    .regex(LOCAL_TIME_REGEX, "Enter a valid 24-hour time, e.g. 09:30")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

const attachmentSchema = z.object({
  publicId: z.string().min(1),
  resourceType: z.enum(["image", "raw"]),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
});

const departureTimePreferenceEnum = z.enum(
  DEPARTURE_TIME_PREFERENCE_VALUES as [DepartureTimePreference, ...DepartureTimePreference[]]
);

// Either a broad window ("morning", "evening", etc. — see
// DEPARTURE_TIME_PREFERENCE_VALUES) or, when the customer picks "Set
// time" in the picker, an exact 24-hour time in the same "HH:MM"
// format as the admin-side departureTime field. Distinct from that
// admin field: this is the customer's stated preference at request
// time, not the confirmed time ops assigns at approval — see
// departureTime on the Quote model.
const departureTimePreferenceField = z
  .union([departureTimePreferenceEnum, z.string().trim().regex(LOCAL_TIME_REGEX, "Enter a valid 24-hour time, e.g. 09:30")])
  .optional();

export const createQuoteSchema = z
  .object({
    contactInfo: z.object({
      fullName: z.string().trim().min(2).max(100),
      email: z.string().trim().email(),
      phone: phoneField,
      company: z.string().trim().max(100).optional(),
    }),
    passengerCount: z.number().int().min(1).max(100),
    departureAirportCode: z.string().trim().min(3).max(4),
    destinationAirportCode: z.string().trim().min(3).max(4),
    departureDate: z.coerce.date(),
    returnDate: z.coerce.date().optional(),
    isRoundTrip: z.boolean().default(false),
    departureTimePreference: departureTimePreferenceField,
    aircraftPreference: objectId.optional(),
    missionType: missionEnum,
    budgetRangeMin: z.number().min(0).optional(),
    budgetRangeMax: z.number().min(0).optional(),
    specialRequests: z.string().trim().max(2000).optional(),
    hasMedicalEquipment: z.boolean().default(false),
    medicalEquipmentDetails: z.string().trim().max(1000).optional(),
    hasVipRequirements: z.boolean().default(false),
    vipRequirementsDetails: z.string().trim().max(1000).optional(),
    hasCargo: z.boolean().default(false),
    cargoDetails: z.string().trim().max(1000).optional(),
    hasPets: z.boolean().default(false),
    petsDetails: z.string().trim().max(500).optional(),
    hasDangerousGoods: z.boolean().default(false),
    dangerousGoodsDetails: z.string().trim().max(1000).optional(),
    attachments: z.array(attachmentSchema).max(10).default([]),
  })
  .refine(
    (data) => data.departureDate.getTime() >= Date.now() - 24 * 60 * 60 * 1000,
    { message: "Departure date must not be in the past", path: ["departureDate"] }
  )
  .refine((data) => !data.isRoundTrip || Boolean(data.returnDate), {
    message: "Return date is required for round trips",
    path: ["returnDate"],
  })
  .refine(
    (data) =>
      data.budgetRangeMin == null ||
      data.budgetRangeMax == null ||
      data.budgetRangeMax >= data.budgetRangeMin,
    { message: "Maximum budget must be greater than minimum budget", path: ["budgetRangeMax"] }
  );

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const approveQuoteSchema = z.object({
  quoteId: objectId,
  aircraftId: objectId,
  quotedAmount: z.number().min(1, "Quoted amount is required"),
  quotedCurrency: z.string().trim().length(3).default("KES"),
  validUntil: z.coerce.date().optional(),
  // Lets the admin confirm or correct the day of flight at the same
  // time as the time below — the customer's requested departureDate is
  // used as the default in the dialog, but ops may need to move it
  // (aircraft availability, slot changes) before sending the priced
  // quote back to the customer.
  departureDate: z.coerce.date().optional(),
  departureTime: optionalTime(),
  // Whether this customer's flight may be pooled with other bookings
  // on the same aircraft/route/time. Defaults to exclusive — sharing
  // is an explicit admin decision, never inferred.
  charterType: charterTypeEnum.default(CHARTER_TYPES.EXCLUSIVE),
  adminNotes: z.string().trim().max(2000).optional(),
});

export type ApproveQuoteInput = z.infer<typeof approveQuoteSchema>;

export const rejectQuoteSchema = z.object({
  quoteId: objectId,
  rejectionReason: z.string().trim().min(5, "Please provide a reason").max(1000),
});

export type RejectQuoteInput = z.infer<typeof rejectQuoteSchema>;

export const acceptQuoteSchema = z.object({
  quoteId: objectId,
});

export type AcceptQuoteInput = z.infer<typeof acceptQuoteSchema>;

export const declineQuoteSchema = z.object({
  quoteId: objectId,
  reason: z.string().trim().max(1000).optional(),
});

export type DeclineQuoteInput = z.infer<typeof declineQuoteSchema>;
export const linkQuoteCustomerSchema = z.object({
  quoteId: objectId,
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export type LinkQuoteCustomerInput = z.infer<typeof linkQuoteCustomerSchema>;
export const updateQuoteNotesSchema = z.object({
  adminNotes: z.string().trim().max(2000).optional(),
});

export const quoteQuerySchema = z.object({
  status: statusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type QuoteQuery = z.infer<typeof quoteQuerySchema>;