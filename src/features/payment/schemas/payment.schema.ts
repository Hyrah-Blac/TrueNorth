import { z } from "zod";
import { KENYAN_PHONE_REGEX, OBJECT_ID_REGEX } from "@/utils/validators";
import { PAYMENT_STATUS_VALUES } from "@/database/constants/payment-status";
import type { PaymentStatus } from "@/database/constants/payment-status";

const objectId = z.string().regex(OBJECT_ID_REGEX, "Invalid ID");

// M-Pesa is a Kenyan payment network — only Kenyan mobile numbers are
// valid (Safaricom 07XX/01XX format). We use KENYAN_PHONE_REGEX here
// rather than the looser GENERAL_PHONE_REGEX so that a non-Kenyan
// number fails validation immediately with a clear message, rather than
// passing Zod, being mangled by toMpesaPhoneFormat into a nonsense
// "254..." string, and then failing with a cryptic Daraja error.
// Phone numbers are naturally typed/pasted with spaces or dashes
// (e.g. "0708 892 669") — strip those before the regex test.
const phoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(
    z.string().regex(
      KENYAN_PHONE_REGEX,
      "Enter a valid Kenyan M-Pesa number (e.g. 0712 345 678 or +254712345678)"
    )
  );

export const initiatePaymentSchema = z.object({
  bookingId: objectId,
  phoneNumber: phoneField,
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

export const verifyPaymentSchema = z.object({
  checkoutRequestId: z.string().min(1, "checkoutRequestId is required"),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// Paystack channel the customer picked on our PaymentCheckout UI. This
// is passed straight through to Paystack's `channels` restriction so
// the hosted checkout only offers the method the customer already
// chose, rather than surfacing every channel Paystack supports.
export const initiatePaystackPaymentSchema = z.object({
  bookingId: objectId,
  channel: z.enum(["mobile_money", "card"]),
});

export type InitiatePaystackPaymentInput = z.infer<typeof initiatePaystackPaymentSchema>;

export const verifyPaystackPaymentSchema = z.object({
  reference: z.string().min(1, "reference is required"),
});

export type VerifyPaystackPaymentInput = z.infer<typeof verifyPaystackPaymentSchema>;

export const paymentQuerySchema = z.object({
  status: z.enum(PAYMENT_STATUS_VALUES as [PaymentStatus, ...PaymentStatus[]]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaymentQuery = z.infer<typeof paymentQuerySchema>;