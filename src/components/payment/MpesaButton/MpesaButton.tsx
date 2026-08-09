"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { DeviceMobile, CheckCircle, Warning } from "@phosphor-icons/react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/buttons/Button";
import { formatCurrency } from "@/utils/currency";
import { initiatePayment, checkPaymentStatus } from "@/features/payment/actions/payment.actions";

type PaymentUiState = "idle" | "awaiting-prompt" | "polling" | "success" | "failed" | "error";

const POLL_INTERVAL_MS = 3500;
const POLL_TIMEOUT_MS = 90_000;

export function MpesaButton({
  bookingId,
  amount,
  currency,
  resumeCheckoutRequestId,
  onPaymentComplete,
}: {
  bookingId: string;
  amount: number;
  currency: string;
  resumeCheckoutRequestId?: string;
  onPaymentComplete?: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [state, setState] = useState<PaymentUiState>(
    resumeCheckoutRequestId ? "polling" : "idle"
  );
  const [message, setMessage] = useState<string | null>(
    resumeCheckoutRequestId
      ? "A payment is already in progress. Check your phone and enter your M-Pesa PIN."
      : null
  );
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef<number>(0);

  useEffect(() => {
    if (resumeCheckoutRequestId) startPolling(resumeCheckoutRequestId);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeCheckoutRequestId]);

  function startPolling(checkoutRequestId: string) {
    setState("polling");
    pollDeadline.current = Date.now() + POLL_TIMEOUT_MS;

    pollTimer.current = setInterval(async () => {
      if (Date.now() > pollDeadline.current) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setState("error");
        setMessage(
          "We haven't received confirmation yet. Check your M-Pesa messages — if money was deducted, it will be applied automatically. Otherwise, try again."
        );
        return;
      }

      const result = await checkPaymentStatus(checkoutRequestId);

      if (result.status === "completed") {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setState("success");
        onPaymentComplete?.();
      } else if (result.status === "failed") {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setState("failed");
        setMessage("The payment was declined or cancelled. Please try again.");
      }
    }, POLL_INTERVAL_MS);
  }

  async function handlePay() {
    setMessage(null);

    if (!phoneNumber.trim()) {
      setMessage("Please enter your M-Pesa phone number to continue.");
      return;
    }

    setState("awaiting-prompt");

    const result = await initiatePayment({ bookingId, phoneNumber });

    if (!result.success || !result.checkoutRequestId) {
      setState("error");
      setMessage(result.error ?? "Unable to start the M-Pesa payment. Please try again.");
      return;
    }

    setMessage(
      result.customerMessage ??
        "Check your phone — enter your M-Pesa PIN to complete the payment."
    );
    startPolling(result.checkoutRequestId);
  }

  // Success state
  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold text-green-800">Payment received.</p>
          <p className="mt-0.5 text-sm text-green-700">
            Your booking has been updated. This page will reflect the new balance shortly.
          </p>
        </div>
      </div>
    );
  }

  // In-flight states — polling or awaiting STK prompt
  if (state === "polling" || state === "awaiting-prompt") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100">
            <Loader2 className="h-4 w-4 animate-spin text-sky-600" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sky-800">
              {state === "awaiting-prompt" ? "Sending payment prompt…" : "Confirming your payment…"}
            </p>
            <p className="mt-1 text-sm text-sky-700">
              {state === "awaiting-prompt"
                ? "The M-Pesa prompt is on its way to your phone."
                : (message ?? "Check your phone and enter your M-Pesa PIN to complete payment.")}
            </p>
            <p className="mt-2 text-xs font-semibold text-sky-700">
              Please don&apos;t submit another payment while this is in progress.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <DeviceMobile className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Waiting for M-Pesa confirmation — this updates automatically</span>
        </div>
      </div>
    );
  }

  // Idle / error / failed — show the form
  return (
    <div className="space-y-4">
      {(state === "error" || state === "failed") && message ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Warning className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
          <p className="text-sm text-red-700">{message}</p>
        </div>
      ) : null}

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Pay with M-Pesa
        </p>
        <FormField label="M-Pesa phone number" htmlFor="mpesa-phone" required hint="e.g. +254 7XX XXX XXX">
          <TextInput
            id="mpesa-phone"
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            disabled={false}
          />
        </FormField>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full justify-center"
        onClick={handlePay}
        icon={<DeviceMobile className="h-4 w-4" />}
      >
        Pay {formatCurrency(amount, currency)}
      </Button>

      <p className="text-center text-[11px] text-slate-400">
        An M-Pesa STK Push will be sent to your phone. Enter your PIN to complete payment.
      </p>
    </div>
  );
}
