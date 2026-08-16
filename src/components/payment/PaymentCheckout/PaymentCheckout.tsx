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
          <Button
            href={activePaymentAuthorizationUrl}
            variant="outline"
            size="lg"
            className="w-full justify-center"
          >
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
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full justify-center"
            onClick={() => handlePay("mobile_money")}
            disabled={pendingChannel !== null}
            icon={
              pendingChannel === "mobile_money" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DeviceMobile className="h-4 w-4" />
              )
            }
          >
            M-Pesa
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-center"
            onClick={() => handlePay("card")}
            disabled={pendingChannel !== null}
            icon={
              pendingChannel === "card" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )
            }
          >
            Debit / Credit Card
          </Button>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        You&apos;ll be securely redirected to Paystack to complete payment. We never see or store your card
        details or M-Pesa PIN.
      </p>
    </div>
  );
}
