"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";
import { ArrowRight } from "@phosphor-icons/react";
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
      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full justify-center"
          onClick={() => setDialog("accept")}
          icon={<ArrowRight className="h-4 w-4" />}
        >
          Accept &amp; Proceed to Payment
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm text-slate-400 transition-colors hover:text-red-600"
          onClick={() => setDialog("decline")}
        >
          Decline this quote
        </button>
      </div>

      {/* Accept confirmation modal */}
      <Modal open={dialog === "accept"} onClose={closeDialog} title="Accept this charter quote?" maxWidth="md">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            By accepting quote <span className="font-medium text-navy-900">{quoteNumber}</span>, you confirm
            you&apos;d like to proceed with the charter under the quoted terms.
          </p>
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            <p className="font-medium">What happens next:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Your booking is created immediately.</li>
              <li>You won&apos;t be charged just by accepting.</li>
              <li>You&apos;ll be taken to the payment screen to pay via M-Pesa.</li>
            </ul>
          </div>
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
            onClick={handleAccept}
            disabled={isPending}
            icon={
              isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />
            }
          >
            {isPending ? "Creating booking…" : "Accept & Continue"}
          </Button>
        </div>
      </Modal>

      {/* Decline modal */}
      <Modal open={dialog === "decline"} onClose={closeDialog} title="Decline this quote?" maxWidth="md">
        <p className="text-sm leading-relaxed text-slate-600">
          Declining <span className="font-medium text-navy-900">{quoteNumber}</span> cannot be undone.
          If you&apos;d like to revisit this in the future, please contact our team.
        </p>
        <div className="mt-5">
          <FormField label="Reason for declining" htmlFor="declineReason" hint="Optional — helps our team improve">
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
            Go back
          </Button>
          <Button
            variant="primary"
            onClick={handleDecline}
            disabled={isPending}
            className="!bg-red-600 hover:!bg-red-700 !border-red-600 hover:!border-red-700"
            icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          >
            {isPending ? "Declining…" : "Decline Quote"}
          </Button>
        </div>
      </Modal>
    </>
  );
}