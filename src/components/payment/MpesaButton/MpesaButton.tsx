"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/buttons/Button";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { formatCurrency } from "@/utils/currency";
import { initiatePayment, checkPaymentStatus } from "@/features/payment/actions/payment.actions";

type PaymentUiState = "idle" | "awaiting-prompt" | "polling" | "success" | "failed" | "error";

const POLL_INTERVAL_MS = 3500;
const POLL_TIMEOUT_MS = 90_000;

export function MpesaButton({
  bookingId,
  amount,
  currency,
  onPaymentComplete,
}: {
  bookingId: string;
  amount: number;
  currency: string;
  onPaymentComplete?: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [state, setState] = useState<PaymentUiState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  function startPolling(checkoutRequestId: string) {
    setState("polling");
    pollDeadline.current = Date.now() + POLL_TIMEOUT_MS;

    pollTimer.current = setInterval(async () => {
      if (Date.now() > pollDeadline.current) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setState("error");
        setMessage("We haven't received confirmation yet. Check your M-Pesa messages, or try again.");
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
        setMessage("The payment was not completed. You can try again below.");
      }
      // Otherwise still pending — keep polling.
    }, POLL_INTERVAL_MS);
  }

  async function handlePay() {
    setMessage(null);

    if (!phoneNumber.trim()) {
      setMessage("Enter the M-Pesa phone number to pay from.");
      return;
    }

    setState("awaiting-prompt");

    const result = await initiatePayment({ bookingId, phoneNumber });

    if (!result.success || !result.checkoutRequestId) {
      setState("error");
      setMessage(result.error ?? "Could not start the M-Pesa payment. Please try again.");
      return;
    }

    setMessage(result.customerMessage ?? "Check your phone and enter your M-Pesa PIN to complete payment.");
    startPolling(result.checkoutRequestId);
  }

  if (state === "success") {
    return <InlineAlert tone="success">Payment received. Your booking has been updated.</InlineAlert>;
  }

  return (
    <div className="space-y-4">
      <FormField label="M-Pesa phone number" htmlFor="mpesa-phone" required hint="e.g. +254 7XX XXX XXX">
        <TextInput
          id="mpesa-phone"
          type="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          disabled={state === "awaiting-prompt" || state === "polling"}
        />
      </FormField>

      {message ? (
        <InlineAlert tone={state === "error" || state === "failed" ? "error" : "pending"}>{message}</InlineAlert>
      ) : null}

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={state === "awaiting-prompt" || state === "polling"}
        onClick={handlePay}
        icon={
          state === "awaiting-prompt" || state === "polling" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : undefined
        }
      >
        {state === "polling"
          ? "Waiting for confirmation…"
          : state === "awaiting-prompt"
            ? "Sending prompt…"
            : `Pay ${formatCurrency(amount, currency)} with M-Pesa`}
      </Button>
    </div>
  );
}
