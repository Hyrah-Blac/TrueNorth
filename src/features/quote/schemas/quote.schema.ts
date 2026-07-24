import { z } from "zod";
import { MISSION_TYPE_VALUES } from "@/database/constants/mission-type";
import type { MissionType } from "@/database/constants/mission-type";
import { QUOTE_STATUS_VALUES } from "@/database/constants/quote-status";
import type { QuoteStatus } from "@/database/constants/quote-status";
import { GENERAL_PHONE_REGEX, OBJECT_ID_REGEX } from "@/utils/validators";

const missionEnum = z.enum(MISSION_TYPE_VALUES as [MissionType, ...MissionType[]]);
const statusEnum = z.enum(QUOTE_STATUS_VALUES as [QuoteStatus, ...QuoteStatus[]]);
const objectId = z.string().regex(OBJECT_ID_REGEX, "Invalid ID");

const attachmentSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
});

export const createQuoteSchema = z
  .object({
    contactInfo: z.object({
      fullName: z.string().trim().min(2).max(100),
      email: z.string().trim().email(),
      phone: z.string().trim().regex(GENERAL_PHONE_REGEX, "Enter a valid phone number"),
      company: z.string().trim().max(100).optional(),
    }),
    passengerCount: z.number().int().min(1).max(100),
    departureAirportCode: z.string().trim().min(3).max(4),
    destinationAirportCode: z.string().trim().min(3).max(4),
    departureDate: z.coerce.date(),
    returnDate: z.coerce.date().optional(),
    isRoundTrip: z.boolean().default(false),
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
  adminNotes: z.string().trim().max(2000).optional(),
});

export type ApproveQuoteInput = z.infer<typeof approveQuoteSchema>;

export const rejectQuoteSchema = z.object({
  quoteId: objectId,
  rejectionReason: z.string().trim().min(5, "Please provide a reason").max(1000),
});

export type RejectQuoteInput = z.infer<typeof rejectQuoteSchema>;

export const updateQuoteNotesSchema = z.object({
  adminNotes: z.string().trim().max(2000).optional(),
});

export const quoteQuerySchema = z.object({
  status: statusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type QuoteQuery = z.infer<typeof quoteQuerySchema>;
