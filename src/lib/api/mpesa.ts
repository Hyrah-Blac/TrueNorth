import "server-only";
import { logger } from "@/lib/logging/logger";

const isProduction = (process.env.MPESA_ENVIRONMENT ?? "production") === "production";
const BASE_URL = isProduction ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

interface CachedToken {
  token: string;
  expiresAt: number;
}

// Module-level cache: Daraja OAuth tokens are valid ~1 hour, and
// re-requesting one on every STK push would be wasteful. This is
// per-instance on Vercel's serverless runtime (same tradeoff as the
// rate limiter), which is fine since a fresh token is cheap to fetch
// on a cold start.
let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa consumer key/secret are not configured");
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("M-Pesa OAuth token request failed", { status: response.status, body });
    throw new Error("Failed to authenticate with M-Pesa");
  }

  const data = (await response.json()) as { access_token: string; expires_in: string };

  cachedToken = {
    token: data.access_token,
    // Refresh a minute early so an in-flight request never uses a token
    // that expires mid-call.
    expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000,
  };

  return cachedToken.token;
}

function buildTimestamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function buildPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  if (!shortcode || !passkey) {
    throw new Error("M-Pesa shortcode/passkey are not configured");
  }

  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

export interface StkPushParams {
  /** Format 2547XXXXXXXX or 2541XXXXXXXX — no leading + */
  phoneNumber: string;
  /** Whole KES units — Daraja rejects decimals */
  amount: number;
  /** Max 12 characters per Daraja's limit */
  accountReference: string;
  /** Max 13 characters per Daraja's limit */
  transactionDesc: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function initiateStkPush(params: StkPushParams): Promise<StkPushResponse> {
  const shortcode = process.env.MPESA_SHORTCODE;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;

  if (!shortcode || !callbackUrl) {
    throw new Error("M-Pesa shortcode/callback URL are not configured");
  }

  const token = await getAccessToken();
  const timestamp = buildTimestamp();
  const password = buildPassword(timestamp);

  const response = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(params.amount),
      PartyA: params.phoneNumber,
      PartyB: shortcode,
      PhoneNumber: params.phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: params.transactionDesc.slice(0, 13),
    }),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    logger.error("M-Pesa STK push request failed", { status: response.status, data });
    throw new Error(data?.errorMessage || "Failed to initiate M-Pesa payment");
  }

  return data as StkPushResponse;
}

export interface StkPushQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

/**
 * Queries Daraja directly for a payment's outcome — used as a
 * fallback when the async callback hasn't arrived (network issues,
 * or the customer checking status sooner than the callback lands).
 */
export async function queryStkPushStatus(checkoutRequestId: string): Promise<StkPushQueryResponse> {
  const shortcode = process.env.MPESA_SHORTCODE;
  if (!shortcode) throw new Error("M-Pesa shortcode is not configured");

  const token = await getAccessToken();
  const timestamp = buildTimestamp();
  const password = buildPassword(timestamp);

  const response = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    logger.error("M-Pesa STK push query failed", { status: response.status, data });
    throw new Error(data?.errorMessage || "Failed to check M-Pesa payment status");
  }

  return data as StkPushQueryResponse;
}
