import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import { QUOTE_STATUS_VALUES, QUOTE_STATUSES, type QuoteStatus } from "../constants/quote-status";
import { MISSION_TYPE_VALUES, type MissionType } from "../constants/mission-type";
import { softDeletePlugin, type SoftDeleteFields, type SoftDeleteMethods } from "../plugins/softDelete";
import { getNextSequence } from "./Counter";

export interface QuoteAttachment {
  publicId: string;
  // Cloudinary resource type the file was stored under ("image" for
  // jpg/png/pdf, "raw" for other allowed formats). Needed to mint a
  // signed viewing URL later — see getSignedAttachmentUrl.
  resourceType: "image" | "raw";
  fileName: string;
  fileType: string;
}

export interface QuoteContactInfo {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
}

export interface QuoteDocument
  extends Document,
    SoftDeleteFields,
    SoftDeleteMethods<QuoteDocument> {
  quoteNumber: string;
  customer?: Types.ObjectId;
  contactInfo: QuoteContactInfo;

  passengerCount: number;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: Date;
  returnDate?: Date;
  isRoundTrip: boolean;

  aircraftPreference?: Types.ObjectId;
  missionType: MissionType;
  budgetRangeMin?: number;
  budgetRangeMax?: number;
  currency: string;

  specialRequests?: string;
  hasMedicalEquipment: boolean;
  medicalEquipmentDetails?: string;
  hasVipRequirements: boolean;
  vipRequirementsDetails?: string;
  hasCargo: boolean;
  cargoDetails?: string;
  hasPets: boolean;
  petsDetails?: string;
  hasDangerousGoods: boolean;
  dangerousGoodsDetails?: string;

  attachments: QuoteAttachment[];

  status: QuoteStatus;
  adminNotes?: string;
  quotedAmount?: number;
  quotedCurrency?: string;
  validUntil?: Date;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  convertedBooking?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const QuoteContactInfoSchema = new Schema<QuoteContactInfo>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?[0-9]{9,15}$/, "Invalid phone number"],
    },
    company: { type: String, trim: true, maxlength: 100 },
  },
  { _id: false }
);

const QuoteAttachmentSchema = new Schema<QuoteAttachment>(
  {
    publicId: { type: String, required: true, trim: true },
    resourceType: { type: String, enum: ["image", "raw"], required: true, default: "image" },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const QuoteSchema = new Schema<QuoteDocument>(
  {
    quoteNumber: { type: String, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", index: true },
    contactInfo: { type: QuoteContactInfoSchema, required: true },

    passengerCount: { type: Number, required: [true, "Passenger count is required"], min: 1 },
    departureAirportCode: {
      type: String,
      required: [true, "Departure airport is required"],
      trim: true,
      uppercase: true,
    },
    destinationAirportCode: {
      type: String,
      required: [true, "Destination airport is required"],
      trim: true,
      uppercase: true,
    },
    departureDate: { type: Date, required: [true, "Departure date is required"] },
    returnDate: { type: Date },
    isRoundTrip: { type: Boolean, default: false },

    aircraftPreference: { type: Schema.Types.ObjectId, ref: "Aircraft" },
    missionType: { type: String, enum: MISSION_TYPE_VALUES, required: true, index: true },
    budgetRangeMin: { type: Number, min: 0 },
    budgetRangeMax: { type: Number, min: 0 },
    currency: { type: String, default: "KES", uppercase: true, maxlength: 3 },

    specialRequests: { type: String, trim: true, maxlength: 2000 },
    hasMedicalEquipment: { type: Boolean, default: false },
    medicalEquipmentDetails: { type: String, trim: true, maxlength: 1000 },
    hasVipRequirements: { type: Boolean, default: false },
    vipRequirementsDetails: { type: String, trim: true, maxlength: 1000 },
    hasCargo: { type: Boolean, default: false },
    cargoDetails: { type: String, trim: true, maxlength: 1000 },
    hasPets: { type: Boolean, default: false },
    petsDetails: { type: String, trim: true, maxlength: 500 },
    hasDangerousGoods: { type: Boolean, default: false },
    dangerousGoodsDetails: { type: String, trim: true, maxlength: 1000 },

    attachments: { type: [QuoteAttachmentSchema], default: [] },

    status: {
      type: String,
      enum: QUOTE_STATUS_VALUES,
      default: QUOTE_STATUSES.PENDING,
      index: true,
    },
    adminNotes: { type: String, trim: true, maxlength: 2000 },
    quotedAmount: { type: Number, min: 0 },
    quotedCurrency: { type: String, uppercase: true, maxlength: 3 },
    validUntil: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 1000 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    convertedBooking: { type: Schema.Types.ObjectId, ref: "Booking" },
  },
  { timestamps: true }
);

QuoteSchema.plugin(softDeletePlugin);

QuoteSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
QuoteSchema.index({ customer: 1, isDeleted: 1 });
QuoteSchema.index({ departureDate: 1 });

// Generates human-readable, sequential quote numbers like
// QT-20260718-0001 using an atomic per-day counter, so concurrent
// inserts (e.g. two charter requests submitted at once) can never
// collide on the same number.
QuoteSchema.pre("validate", async function (this: QuoteDocument, next) {
  if (this.quoteNumber) return next();

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sequence = await getNextSequence(`quote-${datePart}`);

  this.quoteNumber = `QT-${datePart}-${String(sequence).padStart(4, "0")}`;
  next();
});

export const Quote: Model<QuoteDocument> = models.Quote || model<QuoteDocument>("Quote", QuoteSchema);

export default Quote;
