import "server-only";
import crypto from "crypto";
import { logger } from "@/lib/logging/logger";
import { withRetry } from "./retry";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

/** Timeout for all Paystack HTTP calls — same rationale as MPESA_TIMEOUT_MS in mpesa.ts. */
const PAYSTACK_TIMEOUT_MS = 10_000;

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("Paystack secret key is not configured");
  }
  return key;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getSecretKey()}`,
    "Content-Type": "application/json",
  };
}

export interface InitializeTransactionParams {
  /** Customer email — required by Paystack, used for their own receipts. */
  email: string;
  /** Amount already converted to the currency's smallest unit (see toPaystackSubunit). */
  amount: number;
  currency: string;
  /** Our own unique reference — must never be reused across two payments. */
  reference: string;
  /** Where Paystack redirects the browser after checkout completes. */
  callbackUrl: string;
  /** Restrict the hosted checkout to specific channels, e.g. ["card"] or ["mobile_money"]. */
  channels?: string[];
  /** Opaque metadata echoed back on verification — never used as a source of truth. */
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackApiEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * Starts a Paystack transaction and returns the hosted checkout URL to
 * redirect the customer to. Never called with an amount taken directly
 * from the browser — callers must compute/validate the payable amount
 * server-side first (see initiatePaystackPayment.ts).
 */
export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<PaystackInitializeData> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: params.channels,
      metadata: params.metadata,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
  });

  const data = (await response.json()) as PaystackApiEnvelope<PaystackInitializeData>;

  if (!response.ok || !data?.status) {
    logger.error("Paystack transaction initialize failed", {
      status: response.status,
      message: data?.message,
    });
    throw new Error(data?.message || "Failed to initialize Paystack transaction");
  }

  return data.data;
}

export interface PaystackAuthorizationPayload {
  authorization_code?: string;
  last4?: string;
  card_type?: string;
  bank?: string;
  channel?: string;
  reusable?: boolean;
}

export interface PaystackVerifyData {
  status: "success" | "failed" | "abandoned" | string;
  reference: string;
  /** Amount in the currency's smallest unit, as charged by Paystack. */
  amount: number;
  currency: string;
  gateway_response: string;
  channel: string;
  paid_at: string | null;
  id: number;
  ip_address?: string;
  authorization?: PaystackAuthorizationPayload;
  metadata?: Record<string, unknown> | null;
}

/**
 * Independently confirms a transaction's outcome with Paystack. This —
 * not the webhook body, not the browser redirect — is the source of
 * truth for whether a payment succeeded. Wrapped in withRetry: this is
 * a read-only, idempotent lookup, safe to retry on transient failures.
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyData> {
  return withRetry(
    async () => {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: authHeaders(),
          cache: "no-store",
          signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
        }
      );

      const data = (await response.json()) as PaystackApiEnvelope<PaystackVerifyData>;

      if (!response.ok || !data?.status) {
        logger.error("Paystack transaction verify failed", {
          status: response.status,
          message: data?.message,
        });
        throw new Error(data?.message || "Failed to verify Paystack transaction");
      }

      return data.data;
    },
    { attempts: 3, baseDelayMs: 500, label: "Paystack transaction verify" }
  );
}

/**
 * Validates the `x-paystack-signature` header Paystack attaches to every
 * webhook delivery: a hex-encoded HMAC-SHA512 of the exact raw request
 * body, keyed with the same secret key used for API calls (Paystack has
 * no separate webhook signing secret). Uses a timing-safe comparison so
 * this check itself can't leak information via response-time analysis.
 *
 * IMPORTANT: `rawBody` must be the untouched request body text — hash a
 * re-serialized/re-parsed version and this will incorrectly reject
 * genuine events.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  let secret: string;
  try {
    secret = getSecretKey();
  } catch {
    return false;
  }

  const expected = crypto.createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signatureHeader, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
