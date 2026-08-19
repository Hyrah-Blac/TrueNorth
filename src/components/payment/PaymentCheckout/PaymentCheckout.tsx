"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DeviceMobile, CreditCard, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/shared/buttons/Button";
import { formatCurrency } from "@/utils/currency";
import { initiatePaystackPayment } from "@/features/payment/actions/payment.actions";

type PaystackChannel = "mobile_money" | "card";

/**
 * Primary customer-facing payment UI, backed by Paystack. Offers the
 * two channels Paystack exposes for Kenyan charter customers — M-Pesa
 * and card — and redirects the browser to Paystack's own hosted
 * checkout to actually collect payment details. We never collect a
 * card number, CVV, or M-Pesa PIN/OTP directly in this app.
 *
 * The direct Safaricom Daraja integration (MpesaButton) is preserved
 * in the codebase and still fully functional, but this component is
 * what customers see on the booking payment panel going forward.
 */
export function PaymentCheckout({
  bookingId,
  amount,
  currency,
  hasActivePayment,
  activePaymentAuthorizationUrl,
}: {
  bookingId: string;
  amount: number;
  currency: string;
  /** Whether a Paystack payment for this booking is already pending/processing. */
  hasActivePayment?: boolean;
  /** If a pending payment already has a hosted checkout link, offer to resume it. */
  activePaymentAuthorizationUrl?: string;
}) {
  const [pendingChannel, setPendingChannel] = useState<PaystackChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(channel: PaystackChannel) {
    setError(null);
    setPendingChannel(channel);

    const result = await initiatePaystackPayment({ bookingId, channel });

    if (!result.success || !result.authorizationUrl) {
      setPendingChannel(null);
      setError(result.error ?? "Unable to start the payment. Please try again.");
      return;
    }

    // Paystack's hosted checkout is an external page — a full navigation
    // (not a client-side route) is required.
    window.location.href = result.authorizationUrl;
  }

  if (hasActivePayment) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100">
            <Loader2 className="h-4 w-4 animate-spin text-sky-600" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sky-800">A payment is already in progress</p>
            <p className="mt-1 text-sm text-sky-700">
              If you already completed checkout, this page will update automatically once it&apos;s confirmed.
            </p>
          </div>
        </div>
        {activePaymentAuthorizationUrl ? (
          <Button href={activePaymentAuthorizationUrl} variant="primary" size="sm" className="w-full justify-center">
            Resume payment
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Warning className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <div>
        <p className="mb-3 flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Choose payment method</span>
          <span className="normal-case tracking-normal text-slate-500">{formatCurrency(amount, currency)}</span>
        </p>
        {/* Selectable cards (icon chip + label + a leading radio dot) read
            as a proper checkout method picker — the pattern Stripe/Paystack
            themselves use — rather than two same-shaped buttons that just
            happen to sit side by side. Each card gets its own brand tint
            (M-Pesa green, a neutral navy for card) instead of one channel
            being visually "primary" over the other. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handlePay("mobile_money")}
            disabled={pendingChannel !== null}
            className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-all hover:border-green-300 hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              {pendingChannel === "mobile_money" ? (
                <Loader2 className="h-4 w-4 animate-spin text-green-600" aria-hidden="true" />
              ) : (
                <DeviceMobile className="h-4 w-4 text-green-600" weight="fill" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900">M-Pesa</span>
              <span className="block text-xs text-slate-500">Pay by mobile money</span>
            </span>
            <span
              className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 transition-colors group-hover:border-green-400"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => handlePay("card")}
            disabled={pendingChannel !== null}
            className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-all hover:border-navy-900/25 hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900/5">
              {pendingChannel === "card" ? (
                <Loader2 className="h-4 w-4 animate-spin text-navy-700" aria-hidden="true" />
              ) : (
                <CreditCard className="h-4 w-4 text-navy-700" weight="fill" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900">Debit / Credit Card</span>
              <span className="block text-xs text-slate-500">Visa, Mastercard &amp; more</span>
            </span>
            <span
              className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 transition-colors group-hover:border-navy-400"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        You&apos;ll be securely redirected to Paystack to complete payment. We never see or store your card
        details or M-Pesa PIN.
      </p>
    </div>
  );
}