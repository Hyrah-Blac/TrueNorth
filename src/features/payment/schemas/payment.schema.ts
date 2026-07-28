import { z } from "zod";
import { GENERAL_PHONE_REGEX, OBJECT_ID_REGEX } from "@/utils/validators";
import { PAYMENT_STATUS_VALUES } from "@/database/constants/payment-status";
import type { PaymentStatus } from "@/database/constants/payment-status";

const objectId = z.string().regex(OBJECT_ID_REGEX, "Invalid ID");

// Phone numbers are naturally typed/pasted with spaces or dashes
// (e.g. "0708 892 669"). Strip those before testing against
// GENERAL_PHONE_REGEX, which only accepts a leading "+" and digits —
// otherwise every normally-formatted number gets rejected. Downstream,
// toMpesaPhoneFormat() does its own normalization to the 2547XXXXXXXX
// format M-Pesa's API requires, so this only fixes validation, not the
// eventual STK push format.
const phoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(GENERAL_PHONE_REGEX, "Enter a valid phone number"));

export const initiatePaymentSchema = z.object({
  bookingId: objectId,
  phoneNumber: phoneField,
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

export const verifyPaymentSchema = z.object({
  checkoutRequestId: z.string().min(1, "checkoutRequestId is required"),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const paymentQuerySchema = z.object({
  status: z.enum(PAYMENT_STATUS_VALUES as [PaymentStatus, ...PaymentStatus[]]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaymentQuery = z.infer<typeof paymentQuerySchema>;