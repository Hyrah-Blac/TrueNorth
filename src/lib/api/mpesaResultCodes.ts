/**
 * Daraja STK Push result codes.
 *
 * Only ResultCode 0 is a confirmed success.
 * Several non-zero codes mean "not yet answered" — these must NOT be
 * treated as failures; the customer may still respond to the prompt.
 * Everything else is a definitive failure.
 *
 * Sources:
 *   https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 *   https://developer.safaricom.co.ke/docs#error-codes
 */

/** The payment completed successfully. */
export const MPESA_SUCCESS = 0;

/**
 * Result codes that mean the STK prompt is still outstanding —
 * the customer has not yet responded (accepted or declined).
 * Polling should continue; do NOT apply these as failures.
 *
 * 1032 — Request cancelled by user / awaiting response (most common "still pending" code)
 * 1037 — Daraja timed out waiting for the user's response (gateway timeout, not user cancel)
 * 4001 — Internal Safaricom error / request in queue
 */
export const MPESA_PENDING_CODES = new Set([1032, 1037, 4001]);

/**
 * Returns true if a Daraja ResultCode represents a final, definitive
 * outcome (success or failure) that should be applied to the payment.
 * Returns false for transient/pending codes — caller should keep polling.
 */
export function isFinalMpesaResult(resultCode: number): boolean {
  return resultCode === MPESA_SUCCESS || !MPESA_PENDING_CODES.has(resultCode);
}

/**
 * Returns true only when the Daraja query itself could not return a
 * real result code — e.g. the ResponseCode in the outer envelope is
 * non-zero, meaning Daraja couldn't even look up the request.
 * In that case the caller should leave the payment pending and retry.
 */
export function isDarajaQueryError(responseCode: string | undefined): boolean {
  return responseCode !== "0" && responseCode !== undefined;
}