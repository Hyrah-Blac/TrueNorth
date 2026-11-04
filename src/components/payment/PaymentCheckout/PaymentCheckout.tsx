"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DeviceMobile, CreditCard, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/shared/buttons/Button";
import { formatCurrency } from "@/utils/currency";
import { initiatePaystackPayment } from "@/features/payment/actions/payment.actions";

type PaystackChannel = "mobile_money" | "card";

const METHODS: {
  channel: PaystackChannel;
  title: string;
  subtitle: string;
  Icon: typeof DeviceMobile;
}[] = [
  { channel: "mobile_money", title: "M-Pesa", subtitle: "Pay by mobile money", Icon: DeviceMobile },
  { channel: "card", title: "Debit / Credit Card", subtitle: "Visa, Mastercard & more", Icon: CreditCard },
];

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
  const [selected, setSelected] = useState<PaystackChannel>("mobile_money");
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
        <p className="mb-4 flex items-baseline justify-between border-b border-slate-100 pb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          <span>Choose payment method</span>
          <span className="font-display text-sm normal-case tracking-normal text-navy-900">{formatCurrency(amount, currency)}</span>
        </p>
        {/* Method tiles. Selecting a tile only marks it (green radio dot);
            checkout starts from the pay button below, so there's an
            explicit confirm step. Tiles are static — no hover movement or
            colour shifts. */}
        <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {METHODS.map(({ channel, title, subtitle, Icon }) => {
            const isSelected = selected === channel;
            const isPending = pendingChannel === channel;
            return (
              <button
                key={channel}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(channel)}
                disabled={pendingChannel !== null}
                className={`relative flex flex-col gap-4 rounded-2xl border bg-white p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/60 focus-visible:ring-offset-2 disabled:pointer-events-none ${
                  isSelected
                    ? "border-green-600/50 shadow-[0_0_0_1px_rgba(22,163,74,0.35),0_10px_24px_-16px_rgba(22,163,74,0.35)]"
                    : "border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                } ${pendingChannel !== null && !isPending ? "opacity-60" : ""}`}
              >
                <span className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900/[0.035] ring-1 ring-inset ring-navy-900/10">
                    {isPending ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin text-navy-800" aria-hidden="true" />
                    ) : (
                      <Icon className="h-[18px] w-[18px] text-navy-800" weight="light" aria-hidden="true" />
                    )}
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] bg-white ${
                      isSelected ? "border-green-600" : "border-slate-300"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-green-600" /> : null}
                  </span>
                </span>
                <span className="block">
                  <span className="block font-display text-sm font-medium tracking-tight text-navy-900">{title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500">{subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="primary"
          size="md"
          className="mt-4 w-full justify-center"
          onClick={() => handlePay(selected)}
          disabled={pendingChannel !== null}
        >
          {pendingChannel !== null ? "Redirecting…" : `Pay ${formatCurrency(amount, currency)}`}
        </Button>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        You&apos;ll be securely redirected to Paystack to complete payment. We never see or store your card
        details or M-Pesa PIN.
      </p>
    </div>
  );
}