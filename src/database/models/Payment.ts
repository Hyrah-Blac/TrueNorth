import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import {
  PAYMENT_STATUS_VALUES,
  PAYMENT_STATUSES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_METHODS,
  type PaymentStatus,
  type PaymentMethod,
} from "../constants/payment-status";
import { softDeletePlugin, type SoftDeleteFields, type SoftDeleteMethods } from "../plugins/softDelete";
import { getNextSequence } from "./Counter";

export interface MpesaDetails {
  phoneNumber?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  transactionDate?: Date;
  resultCode?: number;
  resultDescription?: string;
}

export interface PaymentDocument
  extends Document,
    SoftDeleteFields,
    SoftDeleteMethods<PaymentDocument> {
  paymentNumber: string;
  booking: Types.ObjectId;
  customer: Types.ObjectId;

  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;

  mpesa: MpesaDetails;

  receiptUrl?: string;
  failureReason?: string;
  refundedAmount?: number;
  refundReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const MpesaDetailsSchema = new Schema<MpesaDetails>(
  {
    phoneNumber: { type: String, trim: true },
    merchantRequestId: { type: String, trim: true, index: true },
    checkoutRequestId: { type: String, trim: true, index: true },
    mpesaReceiptNumber: { type: String, trim: true, index: true },
    transactionDate: { type: Date },
    resultCode: { type: Number },
    resultDescription: { type: String, trim: true },
  },
  { _id: false }
);

const PaymentSchema = new Schema<PaymentDocument>(
  {
    paymentNumber: { type: String, unique: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    amount: { type: Number, required: [true, "Payment amount is required"], min: 1 },
    currency: { type: String, default: "KES", uppercase: true, maxlength: 3 },
    method: { type: String, enum: PAYMENT_METHOD_VALUES, default: PAYMENT_METHODS.MPESA },
    status: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUSES.PENDING,
      index: true,
    },

    mpesa: { type: MpesaDetailsSchema, default: () => ({}) },

    receiptUrl: { type: String, trim: true },
    failureReason: { type: String, trim: true, maxlength: 500 },
    refundedAmount: { type: Number, min: 0 },
    refundReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

PaymentSchema.plugin(softDeletePlugin);

PaymentSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
PaymentSchema.index({ customer: 1, isDeleted: 1 });

// Generates human-readable, day-scoped payment numbers, e.g. PMT-20260718-0001.
// Generates human-readable, day-scoped payment numbers, e.g. PMT-20260718-0001,
// using an atomic per-day counter so concurrent inserts can't collide.
PaymentSchema.pre("validate", async function (this: PaymentDocument, next) {
  if (this.paymentNumber) return next();

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const sequence = await getNextSequence(`payment-${datePart}`);
  this.paymentNumber = `PMT-${datePart}-${String(sequence).padStart(4, "0")}`;
  next();
});

export const Payment: Model<PaymentDocument> =
  models.Payment || model<PaymentDocument>("Payment", PaymentSchema);

export default Payment;
