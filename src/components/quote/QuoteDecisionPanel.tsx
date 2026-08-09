"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";
import { Modal } from "@/components/shared/modals/Modal";
import { Button } from "@/components/shared/buttons/Button";
import { Textarea } from "@/components/forms/Textarea";
import { FormField } from "@/components/forms/FormField";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { customerAcceptQuote, customerDeclineQuote } from "@/features/quote/actions/customerQuote.actions";

type DialogState = "accept" | "decline" | null;

export function QuoteDecisionPanel({ quoteId, quoteNumber }: { quoteId: string; quoteNumber: string }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  function closeDialog() {
    if (isPending) return;
    setDialog(null);
    setError(null);
    setDeclineReason("");
  }

  async function handleAccept() {
    setIsPending(true);
    setError(null);

    const result = await customerAcceptQuote({ quoteId });

    if (!result.success) {
      setIsPending(false);
      setError(result.error);
      return;
    }

    // Take the customer straight to their new booking (where payment
    // happens) instead of leaving them on the quote page to find it
    // themselves. router.refresh() isn't enough on its own here since
    // it wouldn't navigate anywhere — push does both: it lands them on
    // the booking and picks up the fresh server data for that route.
    setDialog(null);
    router.push(`/dashboard/bookings/${result.data.bookingId}`);
    router.refresh();
  }

  async function handleDecline() {
    setIsPending(true);
    setError(null);

    const result = await customerDeclineQuote({ quoteId, reason: declineReason.trim() || undefined });

    setIsPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDialog(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-3">
        <Button
          variant="primary"
          className="flex-1 justify-center"
          onClick={() => setDialog("accept")}
          icon={<Check className="h-4 w-4" />}
        >
          Accept &amp; Continue to Payment
        </Button>
        <Button
          variant="ghost"
          className="flex-1 justify-center !text-red-600 hover:!bg-red-50"
          onClick={() => setDialog("decline")}
          icon={<X className="h-4 w-4" />}
        >
          Decline
        </Button>
      </div>

      <Modal open={dialog === "accept"} onClose={closeDialog} title="Accept this charter quote?" maxWidth="md">
        <p className="text-sm leading-relaxed text-slate-600">
          By accepting quote {quoteNumber}, you confirm that you would like to proceed with the charter
          under the quoted terms. Your booking will be created and you&apos;ll be taken to payment —
          you won&apos;t be charged until you choose to pay with M-Pesa.
        </p>

        {error ? (
          <div className="mt-4">
            <InlineAlert tone="error">{error}</InlineAlert>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={closeDialog} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            disabled={isPending}
            icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          >
            {isPending ? "Accepting…" : "Continue to Payment"}
          </Button>
        </div>
      </Modal>

      <Modal open={dialog === "decline"} onClose={closeDialog} title="Decline this charter quote?" maxWidth="md">
        <p className="text-sm leading-relaxed text-slate-600">
          Declining quote {quoteNumber} cannot be undone. Let us know why, if you&apos;d like — it helps
          our team follow up.
        </p>

        <div className="mt-5">
          <FormField label="Reason" htmlFor="declineReason" hint="Optional">
            <Textarea
              id="declineReason"
              rows={3}
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              disabled={isPending}
            />
          </FormField>
        </div>

        {error ? (
          <div className="mt-4">
            <InlineAlert tone="error">{error}</InlineAlert>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={closeDialog} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDecline}
            disabled={isPending}
            className="!bg-red-600 hover:!bg-red-700"
            icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          >
            {isPending ? "Declining…" : "Decline Quote"}
          </Button>
        </div>
      </Modal>
    </>
  );
}