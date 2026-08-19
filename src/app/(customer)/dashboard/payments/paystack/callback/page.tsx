import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle, Warning, Clock, Question, Ticket as TicketIcon, Receipt } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/shared/buttons/Button";
import { checkPaystackPaymentStatusAction } from "@/features/payment/actions/payment.actions";
import { getMyPaymentById } from "@/features/payment/lib/getPayments";
import { ticketExistsForBooking } from "@/features/ticket/lib/getTicketForBooking";
import { requireAuth } from "@/middleware/auth";
import { checkUserRateLimit, RATE_LIMITS } from "@/middleware/rate-limit";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { PAYMENT_STATUSES } from "@/database/constants/payment-status";

export const metadata: Metadata = { title: "Payment Status" };

interface PaystackCallbackPageProps {
  // Paystack appends both `reference` and `trxref` (same value) to the callback URL.
  // `attempt` is our own addition (see below) — not something Paystack sends.
  searchParams: Promise<{ reference?: string; trxref?: string; attempt?: string }>;
}

// Bounds the auto-refresh below (Phase 6 fix — see the PENDING/PROCESSING
// branch below). Two reasons this cap exists, not just one:
//  1. UX — a payment stuck in PENDING for many minutes (a stalled M-Pesa
//     STK push, a slow Paystack settlement) shouldn't refresh the
//     customer's browser forever with no way out; after this many
//     attempts we stop and hand control back with a manual retry.
//  2. Correctness — this page itself is rate-limited via
//     RATE_LIMITS.DETAIL_PAGE_LOOKUP (20/min). Auto-refreshing every 5s
//     is 12 requests/min, which would trip that same limit — and 404
//     the customer via notFound() below — after ~100 seconds of
//     continuous polling if left uncapped. MAX_AUTO_REFRESH_ATTEMPTS is
//     chosen to stay well under that ceiling.
const MAX_AUTO_REFRESH_ATTEMPTS = 12;
const AUTO_REFRESH_INTERVAL_SECONDS = 5;

/**
 * Where Paystack redirects the browser after checkout. This page is
 * UX only — it never marks a payment successful on its own. It always
 * asks the server to independently re-verify the transaction with
 * Paystack (checkPaystackPaymentStatusAction → applyPaystackResult)
 * before showing anything other than "processing".
 */
export default async function PaystackCallbackPage({ searchParams }: PaystackCallbackPageProps) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;
  const attempt = Number.parseInt(params.attempt ?? "0", 10) || 0;

  const { clerkId } = await requireAuth();
  const rateLimit = checkUserRateLimit(clerkId, "payment-callback", RATE_LIMITS.DETAIL_PAGE_LOOKUP);
  if (!rateLimit.allowed) {
    notFound();
  }

  if (!reference) {
    notFound();
  }

  const result = await checkPaystackPaymentStatusAction(reference);

  if (result.status === PAYMENT_STATUSES.COMPLETED) {
    // Best-effort enrichment only — the payment itself is already
    // genuinely verified above (checkPaystackPaymentStatusAction /
    // applyPaystackResult), this just fetches the booking it paid for
    // so the confirmation screen can show the charter and a direct
    // link to the Phase 2 ticket, instead of only a receipt link. If
    // this lookup fails for any reason, the payment-success state
    // itself is still shown accurately — it just falls back to the
    // plainer receipt-only view rather than blocking on it.
    const charter = result.paymentId ? await getConfirmedCharterSummary(result.paymentId) : null;

    return (
      <StatusScreen
        icon={<CheckCircle className="h-6 w-6" aria-hidden="true" />}
        iconClass="bg-green-100 text-green-600"
        title={charter ? "Your charter is confirmed ✈️" : "Payment successful"}
        description="Your payment has been received and your booking has been updated."
        paymentNumber={result.paymentNumber}
      >
        {charter ? (
          <div className="mt-6 w-full space-y-5 rounded-xl border border-navy-900/10 bg-white p-5 text-left sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-navy-900/10 pb-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  Payment received
                </p>
                <p className="font-editorial spec-readout mt-1 text-xl font-semibold text-navy-900">
                  {formatCurrency(charter.amount, charter.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Booking</p>
                <p className="spec-readout mt-1 text-sm font-medium text-navy-900">{charter.bookingNumber}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Your charter</p>
              <p className="font-editorial mt-1.5 text-lg font-medium text-navy-900">
                {charter.departureAirportCode} <span className="text-champagne-500">→</span>{" "}
                {charter.destinationAirportCode}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(charter.departureDate)}
                {charter.aircraftName ? ` · ${charter.aircraftName}` : ""}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 border-t border-navy-900/10 pt-5 sm:flex-row">
              {charter.hasTicket ? (
                <Button
                  href={`/dashboard/bookings/${charter.bookingId}/ticket`}
                  variant="primary"
                  size="sm"
                  className="w-full justify-center gap-1.5 sm:w-auto"
                >
                  <TicketIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  View Ticket
                </Button>
              ) : (
                // Fully paid, but ticket issuance (a separate, idempotent
                // background step — see Phase 1) hasn't landed yet. Send
                // the customer to the booking page rather than the ticket
                // page, which explains this exact "almost ready" state.
                <Button
                  href={`/dashboard/bookings/${charter.bookingId}`}
                  variant="primary"
                  size="sm"
                  className="w-full justify-center sm:w-auto"
                >
                  View Booking
                </Button>
              )}
              {result.paymentId ? (
                <Button
                  href={`/dashboard/payments/${result.paymentId}`}
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-1.5 sm:w-auto"
                >
                  <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                  View Receipt
                </Button>
              ) : null}
            </div>
          </div>
        ) : result.paymentId ? (
          <Button href={`/dashboard/payments/${result.paymentId}`} variant="primary" size="lg">
            View receipt
          </Button>
        ) : undefined}
      </StatusScreen>
    );
  }

  if (result.status === PAYMENT_STATUSES.FAILED) {
    return (
      <StatusScreen
        icon={<Warning className="h-6 w-6" aria-hidden="true" />}
        iconClass="bg-red-100 text-red-600"
        title="Payment wasn't completed"
        description="Your payment was declined, cancelled, or the checkout session expired. No charge was applied — your booking has not been confirmed yet. You can try again from your booking."
        paymentNumber={result.paymentNumber}
      >
        <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
          <Button href="/dashboard/bookings" variant="primary" size="lg" className="w-full justify-center sm:w-auto">
            Try Payment Again
          </Button>
        </div>
      </StatusScreen>
    );
  }

  if (
    result.status === PAYMENT_STATUSES.PENDING ||
    result.status === PAYMENT_STATUSES.PROCESSING
  ) {
    if (attempt >= MAX_AUTO_REFRESH_ATTEMPTS) {
      // Stopped auto-refreshing (see MAX_AUTO_REFRESH_ATTEMPTS above) —
      // still an honest "not confirmed yet" state, not a failure. The
      // manual link below re-enters this same page with attempt reset
      // to 0, so the customer can resume checking whenever they choose
      // rather than the browser doing it forever unattended.
      return (
        <StatusScreen
          icon={<Clock className="h-6 w-6" aria-hidden="true" />}
          iconClass="bg-sky-100 text-sky-600"
          title="Still confirming your payment"
          description="This is taking longer than usual. Your payment hasn't been lost — Paystack or M-Pesa just haven't confirmed it yet. You can check again in a moment, or come back to your bookings later; this page will update as soon as it's confirmed."
          paymentNumber={result.paymentNumber}
        >
          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
            <Button
              href={`/dashboard/payments/paystack/callback?reference=${encodeURIComponent(reference)}`}
              variant="primary"
              size="lg"
              className="w-full justify-center sm:w-auto"
            >
              Check Again
            </Button>
            <Button href="/dashboard/bookings" variant="outline" size="lg" className="w-full justify-center sm:w-auto">
              Back to bookings
            </Button>
          </div>
        </StatusScreen>
      );
    }

    return (
      <StatusScreen
        icon={<Clock className="h-6 w-6" aria-hidden="true" />}
        iconClass="bg-sky-100 text-sky-600"
        title="Payment received — confirming your booking"
        description="We're still waiting on final confirmation from Paystack. This can take a moment for M-Pesa payments — this page will update automatically once it's confirmed, no need to refresh."
        paymentNumber={result.paymentNumber}
        // Re-runs this same server-verified check on an interval —
        // never flips to "confirmed" from anything the browser alone
        // decides (Phase 3 requirement #18). Stops polling once this
        // component unmounts (i.e. once the page has navigated away
        // after a status change re-render), AND is capped at
        // MAX_AUTO_REFRESH_ATTEMPTS (see above) so it can never poll
        // indefinitely or trip this page's own rate limit.
        autoRefreshUrl={`/dashboard/payments/paystack/callback?reference=${encodeURIComponent(reference)}&attempt=${attempt + 1}`}
        autoRefreshSeconds={AUTO_REFRESH_INTERVAL_SECONDS}
      >
        <Button href="/dashboard/bookings" variant="outline" size="lg" className="mt-2">
          Back to bookings
        </Button>
      </StatusScreen>
    );
  }

  // "unknown" — the reference didn't match a payment we can show the
  // customer, or the status check itself failed. Never claim success here.
  return (
    <StatusScreen
      icon={<Question className="h-6 w-6" aria-hidden="true" />}
      iconClass="bg-slate-100 text-slate-500"
      title="Unable to confirm payment"
      description="We couldn't confirm this payment's status right now. If money was deducted, it will be applied to your booking automatically once confirmed — otherwise, please try again."
    >
      <Button href="/dashboard/bookings" variant="outline" size="lg" className="mt-2">
        Back to bookings
      </Button>
    </StatusScreen>
  );
}

interface ConfirmedCharterSummary {
  bookingId: string;
  bookingNumber: string;
  amount: number;
  currency: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  aircraftName?: string;
  hasTicket: boolean;
}

/**
 * Best-effort lookup for the confirmation screen only — reuses the
 * same authenticated, ownership-checked lookups already used
 * elsewhere (getMyPaymentById, ticketExistsForBooking) rather than a
 * new query path. Returns null on any failure so the caller can fall
 * back to the plain receipt-only confirmation instead of erroring the
 * whole page over what is, at this point, a purely cosmetic addition.
 */
async function getConfirmedCharterSummary(paymentId: string): Promise<ConfirmedCharterSummary | null> {
  try {
    const payment = await getMyPaymentById(paymentId);
    if (typeof payment.booking !== "object") return null;
    const booking = payment.booking;

    const aircraftName = typeof booking.aircraft === "object" ? booking.aircraft.name : undefined;
    const hasTicket = await ticketExistsForBooking(booking._id);

    return {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      amount: payment.amount,
      currency: payment.currency,
      departureAirportCode: booking.departureAirportCode,
      destinationAirportCode: booking.destinationAirportCode,
      departureDate: booking.departureDate,
      aircraftName,
      hasTicket,
    };
  } catch {
    return null;
  }
}

function StatusScreen({
  icon,
  iconClass,
  title,
  description,
  paymentNumber,
  autoRefreshSeconds,
  autoRefreshUrl,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  paymentNumber?: string;
  /** When set (with autoRefreshUrl), the browser reloads this page after this many seconds — used only for the still-confirming state, never to fabricate a result client-side. Bounded by MAX_AUTO_REFRESH_ATTEMPTS above, not indefinite. */
  autoRefreshSeconds?: number;
  /** The URL to reload to — carries the incrementing `attempt` param so the bound above can actually be enforced (a plain `content="5"` refresh with no URL just reloads the same params forever). */
  autoRefreshUrl?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      {autoRefreshSeconds && autoRefreshUrl ? (
        <meta httpEquiv="refresh" content={`${autoRefreshSeconds};url=${autoRefreshUrl}`} />
      ) : null}
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
        {icon}
      </span>
      <div>
        <h1 className="font-editorial text-xl font-medium text-navy-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        {paymentNumber ? (
          <p className="spec-readout mt-3 text-xs text-slate-400">Reference: {paymentNumber}</p>
        ) : null}
      </div>
      {children ? <div className="mt-2 flex w-full flex-col items-center">{children}</div> : null}
    </div>
  );
}