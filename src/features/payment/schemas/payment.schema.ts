import { z } from "zod";
import { GENERAL_PHONE_REGEX, OBJECT_ID_REGEX } from "@/utils/validators";
import { PAYMENT_STATUS_VALUES } from "@/database/constants/payment-status";
import type { PaymentStatus } from "@/database/constants/payment-status";

const objectId = z.string().regex(OBJECT_ID_REGEX, "Invalid ID");

export const initiatePaymentSchema = z.object({
  bookingId: objectId,
  phoneNumber: z.string().trim().regex(GENERAL_PHONE_REGEX, "Enter a valid phone number"),
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
