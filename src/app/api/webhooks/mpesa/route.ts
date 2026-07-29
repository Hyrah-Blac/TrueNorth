import { NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { applyMpesaResult } from "@/features/payment/lib/applyMpesaResult";
import { queryStkPushStatus } from "@/lib/api/mpesa";
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
  // the callback body alone is not trusted as proof of payment.
  // Anyone who learns a CheckoutRequestID (visible client-side while a
  // payment is pending) could otherwise POST a forged ResultCode: 0 to
  // this endpoint and get a booking marked "paid" for free. Instead:
  // (1) the callback body is used only to find *which* payment to
  // check, never to decide its outcome, (2) the actual result is
  // fetched fresh from Safaricom's Transaction Status Query API
  // (queryStkPushStatus) and that response is what gets applied, and
  // (3) applyMpesaResult's idempotency guard still protects against
  // duplicate/replayed callbacks. For extra hardening, also restrict
  // this route to Safaricom's published IP ranges at the Vercel/infra
  // layer.
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

    // Independently confirm the outcome with Safaricom rather than
    // trusting the POST body — the body is only used to know which
    // payment to look up. If this call fails or disagrees with what
    // the callback claimed, the callback is not applied; it's logged
    // loudly for manual review instead of silently trusted.
    let verified: Awaited<ReturnType<typeof queryStkPushStatus>>;

    try {
      verified = await queryStkPushStatus(stkCallback.CheckoutRequestID);
    } catch (verifyError) {
      logger.error("M-Pesa callback could not be verified against Safaricom — not applied", {
        checkoutRequestId: stkCallback.CheckoutRequestID,
        error: String(verifyError),
      });
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const verifiedResultCode = Number(verified.ResultCode);

    if (
      verified.MerchantRequestID !== stkCallback.MerchantRequestID ||
      verified.CheckoutRequestID !== stkCallback.CheckoutRequestID ||
      verifiedResultCode !== stkCallback.ResultCode
    ) {
      logger.error("M-Pesa callback result did not match Safaricom's own record — rejected", {
        checkoutRequestId: stkCallback.CheckoutRequestID,
        claimedResultCode: stkCallback.ResultCode,
        verifiedResultCode,
      });
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const items = stkCallback.CallbackMetadata?.Item ?? [];
    const mpesaReceiptNumber = getMetadataValue(items, "MpesaReceiptNumber");
    const transactionDateRaw = getMetadataValue(items, "TransactionDate");

    await applyMpesaResult(payment, {
      resultCode: verifiedResultCode,
      resultDescription: verified.ResultDesc,
      mpesaReceiptNumber: mpesaReceiptNumber ? String(mpesaReceiptNumber) : undefined,
      transactionDate:
        typeof transactionDateRaw === "number" ? parseTransactionDate(transactionDateRaw) : undefined,
    });

    logger.info("M-Pesa callback verified and processed", {
      checkoutRequestId: stkCallback.CheckoutRequestID,
      resultCode: verifiedResultCode,
    });
  } catch (error) {
    // Log loudly but still acknowledge — Daraja will retry a failed
    // (non-2xx) callback, which won't help if the failure is on our
    // side, and could create duplicate processing attempts.
    logger.error("Error processing M-Pesa callback", { error: String(error) });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}