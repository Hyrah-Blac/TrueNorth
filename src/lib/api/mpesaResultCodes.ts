/**
 * Daraja STK Push result codes.
 *
 * Only ResultCode 0 is a confirmed success. Every other ResultCode
 * returned by the Query API is a genuine, final outcome — including
 * 1032 ("Request cancelled by user") and 1037 ("DS timeout, user
 * cannot be reached"), which are definitive cancellations/timeouts,
 * NOT "still awaiting response" signals as previously assumed here.
 *
 * The real "still pending" signal from Daraja is at the HTTP level,
 * not the ResultCode level: while the STK prompt is still on-screen,
 * the Query API responds with a non-2xx status and a body like
 * { "errorCode": "500.001.1001", "errorMessage": "The transaction is
 * being processed" }. That case is already handled in mpesa.ts by
 * throwing (queryStkPushStatus never returns a ResultCode for it), so
 * by the time a ResultCode reaches this module, Daraja has genuinely
 * resolved the request.
 *
 * However, the Query API is known to be flaky/premature in practice —
 * it can report a failure-looking ResultCode moments after the STK
 * push is sent, before the customer has actually had a chance to
 * respond, and the transaction can still complete successfully
 * afterwards via the async callback. So a *failure* ResultCode from a
 * live query is only trustworthy once the STK prompt would realistically
 * have been resolved one way or another. shouldTrustQueryFailure()
 * enforces that grace window; success (0) is always trusted immediately.
 *
 * Sources:
 *   https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 *   https://developer.safaricom.co.ke/docs#error-codes
 */

/** The payment completed successfully. */
export const MPESA_SUCCESS = 0;

/**
 * How long to wait, from the moment the Payment record was created,
 * before trusting a *failure* ResultCode returned by a live status
 * query. Matches the ~60s window Safaricom's STK prompt stays valid
 * on the customer's phone. A success result is never delayed by this —
 * only used to avoid prematurely writing FAILED while the query API
 * may still be reporting a stale/incorrect result.
 */
export const MPESA_QUERY_FAILURE_GRACE_MS = 60_000;

/**
 * Whether a failure ResultCode from the Query API is old enough to be
 * trusted and written to the Payment. Success results should always
 * be applied immediately regardless of this check.
 */
export function shouldTrustQueryFailure(paymentCreatedAt: Date): boolean {
  return Date.now() - paymentCreatedAt.getTime() >= MPESA_QUERY_FAILURE_GRACE_MS;
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