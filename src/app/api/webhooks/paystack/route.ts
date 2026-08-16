import { NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/database/connection";
import Payment from "@/database/models/Payment";
import { verifyWebhookSignature, verifyTransaction } from "@/lib/api/paystack";
import { applyPaystackResult } from "@/features/payment/lib/applyPaystackResult";
import { logger } from "@/lib/logging/logger";

const paystackWebhookSchema = z.object({
  event: z.string(),
  data: z.object({ reference: z.string() }).passthrough(),
});

export async function POST(req: Request) {
  // Paystack signs every delivery with an x-paystack-signature header —
  // a hex HMAC-SHA512 of the exact raw body, keyed with the Paystack
  // secret key (Paystack has no separate webhook signing secret). This
  // must be computed against the untouched request text, so the body
  // is read as text BEFORE any JSON parsing happens.
  const signature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn("Paystack webhook signature verification failed — rejected");
    return NextResponse.json({ received: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.warn("Paystack webhook received invalid JSON");
    return NextResponse.json({ received: true });
  }

  const parsed = paystackWebhookSchema.safeParse(payload);

  if (!parsed.success) {
    logger.warn("Paystack webhook payload did not match expected shape", {
      issues: parsed.error.issues,
    });
    // Acknowledge anyway — a malformed payload won't fix itself on a
    // Paystack retry, and returning non-2xx would just trigger their
    // retry schedule for up to 72 hours for no benefit.
    return NextResponse.json({ received: true });
  }

  const { event, data } = parsed.data;

  // Only charge.success can ever credit a booking. Every other event
  // type (charge.failed, refund.processed, transfer.*, subscription.*,
  // etc.) is intentionally ignored here — but still acknowledged with
  // 200 so Paystack doesn't keep retrying something we deliberately
  // don't act on.
  if (event !== "charge.success") {
    logger.info("Paystack webhook received an event type this integration doesn't act on", { event });
    return NextResponse.json({ received: true });
  }

  const { reference } = data;

  try {
    await connectToDatabase();

    const payment = await Payment.findOne({ "paystack.reference": reference });

    if (!payment) {
      logger.warn("Paystack webhook for unknown reference", { reference });
      return NextResponse.json({ received: true });
    }

    // The webhook body itself is never trusted for the actual outcome —
    // only used to know which payment to look up. The real result is
    // fetched fresh from Paystack's verify endpoint, and applyPaystackResult
    // additionally re-checks amount/currency/reference before ever
    // marking anything completed. This also means a forged POST to this
    // endpoint from someone who merely learned a reference (visible
    // client-side while checkout is pending) can't do anything: it would
    // still have to pass signature verification above AND produce a
    // matching verified "success" from Paystack's own API.
    let verified: Awaited<ReturnType<typeof verifyTransaction>>;

    try {
      verified = await verifyTransaction(reference);
    } catch (verifyError) {
      logger.error("Paystack webhook could not be verified against Paystack — not applied", {
        reference,
        error: String(verifyError),
      });
      return NextResponse.json({ received: true });
    }

    await applyPaystackResult(payment, { verified });

    logger.info("Paystack webhook verified and processed", { reference, status: verified.status });
  } catch (error) {
    logger.error("Error processing Paystack webhook", { reference, error: String(error) });
  }

  return NextResponse.json({ received: true });
}
