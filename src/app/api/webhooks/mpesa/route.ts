import { NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { applyMpesaResult } from "@/features/payment/lib/applyMpesaResult";
import { logger } from "@/lib/logging/logger";

const callbackItemSchema = z.object({
  Name: z.string(),
  Value: z.union([z.string(), z.number()]).optional(),
});

const stkCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(callbackItemSchema),
        })
        .optional(),
    }),
  }),
});

function parseTransactionDate(value: number): Date {
  // Daraja sends this as YYYYMMDDHHmmss, e.g. 20260718142230.
  const str = String(value);
  const year = Number(str.slice(0, 4));
  const month = Number(str.slice(4, 6)) - 1;
  const day = Number(str.slice(6, 8));
  const hour = Number(str.slice(8, 10));
  const minute = Number(str.slice(10, 12));
  const second = Number(str.slice(12, 14));
  return new Date(year, month, day, hour, minute, second);
}

function getMetadataValue(items: { Name: string; Value?: string | number }[], name: string) {
  return items.find((item) => item.Name === name)?.Value;
}

export async function POST(req: Request) {
  // Daraja does not sign callback payloads the way Clerk/Stripe do, so
  // this endpoint relies on: (1) the callback URL being unguessable
  // (configured only in the Daraja app, never exposed publicly), (2)
  // strict payload shape validation below, and (3) applyMpesaResult's
  // idempotency guard against duplicate/replayed callbacks. For extra
  // hardening, restrict this route to Safaricom's published IP ranges
  // at the Vercel/infra layer.
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    logger.warn("M-Pesa callback received invalid JSON");
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const parsed = stkCallbackSchema.safeParse(payload);

  if (!parsed.success) {
    logger.warn("M-Pesa callback payload did not match expected shape", {
      issues: parsed.error.issues,
    });
    // Still acknowledge with 200 — Daraja retries on non-2xx, and a
    // malformed payload won't fix itself on retry.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const { stkCallback } = parsed.data.Body;

  try {
    await connectToDatabase();

    const payment = await Payment.findOne({
      "mpesa.checkoutRequestId": stkCallback.CheckoutRequestID,
    });

    if (!payment) {
      logger.warn("M-Pesa callback for unknown CheckoutRequestID", {
        checkoutRequestId: stkCallback.CheckoutRequestID,
      });
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const items = stkCallback.CallbackMetadata?.Item ?? [];
    const mpesaReceiptNumber = getMetadataValue(items, "MpesaReceiptNumber");
    const transactionDateRaw = getMetadataValue(items, "TransactionDate");

    await applyMpesaResult(payment, {
      resultCode: stkCallback.ResultCode,
      resultDescription: stkCallback.ResultDesc,
      mpesaReceiptNumber: mpesaReceiptNumber ? String(mpesaReceiptNumber) : undefined,
      transactionDate:
        typeof transactionDateRaw === "number" ? parseTransactionDate(transactionDateRaw) : undefined,
    });

    logger.info("M-Pesa callback processed", {
      checkoutRequestId: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
    });
  } catch (error) {
    // Log loudly but still acknowledge — Daraja will retry a failed
    // (non-2xx) callback, which won't help if the failure is on our
    // side, and could create duplicate processing attempts.
    logger.error("Error processing M-Pesa callback", { error: String(error) });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
