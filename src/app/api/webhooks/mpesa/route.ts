import { NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { applyMpesaResult } from "@/features/payment/lib/applyMpesaResult";
import { queryStkPushStatus } from "@/lib/api/mpesa";
import { logger } from "@/lib/logging/logger";

/**
 * Safaricom's published callback IP ranges (as of 2025).
 * These are defence-in-depth: even if an attacker learns a
 * CheckoutRequestID, they cannot trigger callback processing from an
 * IP outside this list. The primary protection is still the
 * independent re-verification via queryStkPushStatus below.
 *
 * Production: restrict at the Vercel/infra layer as well (firewall
 * rules), so requests from other IPs never reach this function at all.
 * Update this list if Safaricom publishes new ranges.
 */
const SAFARICOM_IP_ALLOWLIST = new Set([
  "196.201.214.200",
  "196.201.214.206",
  "196.201.213.114",
  "196.201.214.207",
  "196.201.214.208",
  "196.201.213.44",
  "196.201.212.127",
  "196.201.212.138",
  "196.201.212.129",
  "196.201.212.136",
  "196.201.212.74",
  "196.201.212.69",
]);

function getCallerIp(req: Request): string {
  // x-forwarded-for is a comma-separated chain that grows by one entry
  // per hop: client-claimed values (fully attacker-controlled) are
  // prepended at the left, and each proxy appends the address it
  // actually observed at the right. Reading [0] — the previous
  // behavior — trusts whatever the caller put there, making this
  // allowlist trivially bypassable by sending a fake
  // `X-Forwarded-For: 196.201.214.200` header. The rightmost entry is
  // the one our own edge (Vercel, sitting directly in front of this
  // function) appended from the real TCP connection, which is the only
  // segment of this header that isn't attacker-controlled in a
  // single-hop deployment. If a proxy is ever added in front of
  // Vercel, this needs to become "the Nth-from-right" for the number
  // of trusted hops instead.
  const forwarded = req.headers.get("x-forwarded-for");
  const hops = forwarded?.split(",").map((ip) => ip.trim()).filter(Boolean) ?? [];
  return hops.length > 0 ? hops[hops.length - 1] : "";
}

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
  // check, never to decide its outcome; (2) the actual result is
  // fetched fresh from Safaricom's Transaction Status Query API
  // (queryStkPushStatus) and that response is what gets applied; and
  // (3) applyMpesaResult's idempotency guard still protects against
  // duplicate/replayed callbacks.
  //
  // Additionally: enforce Safaricom's published IP allowlist as a
  // defence-in-depth layer. Requests from outside that set are logged
  // and rejected before we even parse the body. Also restrict at the
  // Vercel/infra layer so rogue requests don't reach this function.
  const callerIp = getCallerIp(req);
  if (!SAFARICOM_IP_ALLOWLIST.has(callerIp)) {
    logger.warn("M-Pesa webhook request from unexpected IP — rejected", { callerIp });
    // Return 200 so Daraja doesn't retry (retries from the wrong IP
    // won't help), but log loudly for ops visibility.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

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