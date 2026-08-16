import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import {
  PAYMENT_STATUS_VALUES,
  PAYMENT_STATUSES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_METHODS,
  PAYMENT_PROVIDER_VALUES,
  PAYMENT_PROVIDERS,
  type PaymentStatus,
  type PaymentMethod,
  type PaymentProvider,
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

/**
 * Safe, non-sensitive metadata about a card kept for a Paystack
 * "authorization" — enough to identify the card on receipts/admin
 * screens (e.g. "Visa ····4242") without ever touching the full PAN,
 * CVV, PIN, or OTP, none of which Paystack returns to merchants anyway.
 */
export interface PaystackAuthorizationDetails {
  authorizationCode?: string;
  last4?: string;
  cardType?: string;
  bank?: string;
  channel?: string;
  reusable?: boolean;
}

export interface PaystackDetails {
  /** Our own unique reference sent to Paystack — equals paymentNumber. */
  reference?: string;
  accessCode?: string;
  authorizationUrl?: string;
  /** Paystack's own numeric transaction id, returned on verification. */
  transactionId?: number;
  /** e.g. "card" | "mobile_money" */
  channel?: string;
  gatewayResponse?: string;
  paidAt?: Date;
  ipAddress?: string;
  authorization?: PaystackAuthorizationDetails;
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
  /** Which system processed this payment. Defaults to "mpesa" for records created before Paystack existed. */
  provider: PaymentProvider;

  mpesa: MpesaDetails;
  paystack: PaystackDetails;

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

const PaystackAuthorizationDetailsSchema = new Schema<PaystackAuthorizationDetails>(
  {
    // Paystack's authorization_code identifies a reusable card token for
    // future off-session charges. It is NOT the PAN/CVV — Paystack never
    // returns those to merchants — but is still only stored here (never
    // logged) since it can be used to charge the card again.
    authorizationCode: { type: String, trim: true },
    last4: { type: String, trim: true, maxlength: 4 },
    cardType: { type: String, trim: true },
    bank: { type: String, trim: true },
    channel: { type: String, trim: true },
    reusable: { type: Boolean },
  },
  { _id: false }
);

const PaystackDetailsSchema = new Schema<PaystackDetails>(
  {
    reference: { type: String, trim: true },
    accessCode: { type: String, trim: true },
    authorizationUrl: { type: String, trim: true },
    transactionId: { type: Number },
    channel: { type: String, trim: true },
    gatewayResponse: { type: String, trim: true },
    paidAt: { type: Date },
    ipAddress: { type: String, trim: true },
    authorization: { type: PaystackAuthorizationDetailsSchema },
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
    provider: {
      type: String,
      enum: PAYMENT_PROVIDER_VALUES,
      default: PAYMENT_PROVIDERS.MPESA,
      index: true,
    },

    mpesa: { type: MpesaDetailsSchema, default: () => ({}) },
    paystack: { type: PaystackDetailsSchema, default: () => ({}) },

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
PaymentSchema.index({ provider: 1, booking: 1 });
// unique+sparse: our own reference sent to Paystack must never be reused
// across two Payment records — this is the DB-level backstop behind the
// idempotency guard in applyPaystackResult/initiatePaystackPayment.
PaymentSchema.index({ "paystack.reference": 1 }, { unique: true, sparse: true });
// Paystack's own transaction id, once known, must also be unique per
// Payment — guards against a replayed/duplicated webhook ever being
// applied to two different Payment documents.
PaymentSchema.index({ "paystack.transactionId": 1 }, { unique: true, sparse: true });

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
