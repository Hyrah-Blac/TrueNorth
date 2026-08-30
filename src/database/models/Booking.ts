import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import {
  BOOKING_STATUS_VALUES,
  BOOKING_STATUSES,
  type BookingStatus,
} from "../constants/booking-status";
import { MISSION_TYPE_VALUES, type MissionType } from "../constants/mission-type";
import { CHARTER_TYPE_VALUES, CHARTER_TYPES, type CharterType } from "../constants/charter-type";
import { softDeletePlugin, type SoftDeleteFields, type SoftDeleteMethods } from "../plugins/softDelete";
import { getNextSequence } from "./Counter";

export interface BookingTimelineEntry {
  status: BookingStatus;
  note?: string;
  changedBy?: Types.ObjectId;
  changedAt: Date;
}

export interface BookingDocument
  extends Document,
    SoftDeleteFields,
    SoftDeleteMethods<BookingDocument> {
  bookingNumber: string;
  quote?: Types.ObjectId;
  customer: Types.ObjectId;
  aircraft: Types.ObjectId;

  passengerCount: number;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: Date;
  returnDate?: Date;
  isRoundTrip: boolean;
  missionType: MissionType;

  // Whether this booking's aircraft assignment may be pooled with other
  // customers' bookings on the same flight (see
  // features/booking/lib/aircraftAvailability.ts). Defaults to
  // "exclusive" so pre-existing bookings, and any booking created
  // without an explicit choice, keep the platform's original
  // whole-aircraft-per-booking behaviour.
  charterType: CharterType;

  // Day-of-travel logistics — filled in by ops once known, typically
  // closer to departure than the rest of the booking. All optional:
  // a booking is valid without them, but once set they're surfaced on
  // the customer's booking page, the digital ticket, and the reminder
  // email so "when and where do I show up" is answered on-platform
  // instead of over email/WhatsApp only.
  departureTime?: string;
  fboName?: string;
  fboAddress?: string;
  groundContactPhone?: string;

  totalAmount: number;
  paidAmount: number;
  currency: string;

  specialRequests?: string;
  status: BookingStatus;
  timeline: BookingTimelineEntry[];

  modificationRequested: boolean;
  modificationNotes?: string;
  cancellationRequested: boolean;
  cancellationReason?: string;

  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  reminderSentAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  balanceAmount: number;
}

const BookingTimelineEntrySchema = new Schema<BookingTimelineEntry>(
  {
    status: { type: String, enum: BOOKING_STATUS_VALUES, required: true },
    note: { type: String, trim: true, maxlength: 500 },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const BookingSchema = new Schema<BookingDocument>(
  {
    bookingNumber: { type: String, unique: true, index: true },
    // unique+sparse: a quote can convert to at most one booking. This is a
    // DB-level backstop behind the transaction in acceptQuoteById — even if
    // that logic were ever called twice for the same quote, Mongo itself
    // rejects the second booking insert instead of silently duplicating it.
    quote: { type: Schema.Types.ObjectId, ref: "Quote", unique: true, sparse: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    aircraft: { type: Schema.Types.ObjectId, ref: "Aircraft", required: true, index: true },

    passengerCount: { type: Number, required: true, min: 1 },
    departureAirportCode: { type: String, required: true, trim: true, uppercase: true },
    destinationAirportCode: { type: String, required: true, trim: true, uppercase: true },
    departureDate: { type: Date, required: true, index: true },
    returnDate: { type: Date },
    isRoundTrip: { type: Boolean, default: false },
    missionType: { type: String, enum: MISSION_TYPE_VALUES, required: true },
    charterType: {
      type: String,
      enum: CHARTER_TYPE_VALUES,
      default: CHARTER_TYPES.EXCLUSIVE,
      index: true,
    },

    // Free-text HH:mm-style local time (e.g. "09:30") rather than folded
    // into departureDate — keeps the existing date-only handling used
    // throughout quotes/booking creation untouched, and avoids baking in
    // timezone assumptions for a value ops enters manually per booking.
    departureTime: { type: String, trim: true, maxlength: 20 },
    fboName: { type: String, trim: true, maxlength: 200 },
    fboAddress: { type: String, trim: true, maxlength: 300 },
    groundContactPhone: { type: String, trim: true, maxlength: 30 },

    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "KES", uppercase: true, maxlength: 3 },

    specialRequests: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: BOOKING_STATUS_VALUES,
      default: BOOKING_STATUSES.PENDING,
      index: true,
    },
    timeline: { type: [BookingTimelineEntrySchema], default: [] },

    modificationRequested: { type: Boolean, default: false },
    modificationNotes: { type: String, trim: true, maxlength: 1000 },
    cancellationRequested: { type: Boolean, default: false },
    cancellationReason: { type: String, trim: true, maxlength: 1000 },

    confirmedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    reminderSentAt: { type: Date },
  },
  { timestamps: true }
);

BookingSchema.plugin(softDeletePlugin);

BookingSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
BookingSchema.index({ customer: 1, isDeleted: 1 });
BookingSchema.index({ aircraft: 1, departureDate: 1 });

BookingSchema.virtual("balanceAmount").get(function (this: BookingDocument) {
  return Math.max(this.totalAmount - this.paidAmount, 0);
});

BookingSchema.set("toJSON", { virtuals: true });
BookingSchema.set("toObject", { virtuals: true });

// Generates human-readable, day-scoped booking numbers, e.g. BK-20260718-0001,
// using an atomic per-day counter so concurrent inserts can't collide.
BookingSchema.pre("validate", async function (this: BookingDocument, next) {
  if (this.bookingNumber) return next();

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sequence = await getNextSequence(`booking-${datePart}`);
  this.bookingNumber = `BK-${datePart}-${String(sequence).padStart(4, "0")}`;

  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({ status: this.status, changedAt: new Date() });
  }

  next();
});

export const Booking: Model<BookingDocument> =
  models.Booking || model<BookingDocument>("Booking", BookingSchema);

export default Booking;