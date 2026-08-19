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

export interface QuoteProposalSummary {
  route: string;
  date: string;
  passengers: string;
  aircraft?: string;
  price?: string;
}

export function QuoteDecisionPanel({
  quoteId,
  quoteNumber,
  summary,
}: {
  quoteId: string;
  quoteNumber: string;
  /** Concise proposal facts shown in the accept-confirmation dialog — presentation only, not read by the accept/decline logic itself. */
  summary?: QuoteProposalSummary;
}) {
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
          size="sm"
          className="w-full justify-center"
          onClick={() => setDialog("accept")}
        >
          Accept proposal
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm text-slate-400 transition-colors hover:text-red-600"
          onClick={() => setDialog("decline")}
        >
          Decline proposal
        </button>
      </div>

      {/* Accept confirmation modal */}
      <Modal open={dialog === "accept"} onClose={closeDialog} title="Accept this charter proposal?" maxWidth="md">
        <div className="space-y-5">
          {summary ? (
            <dl className="space-y-2 border-b border-slate-100 pb-4 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-400">Route</dt>
                <dd className="font-medium text-navy-900">{summary.route}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-400">Date</dt>
                <dd className="font-medium text-navy-900">{summary.date}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-slate-400">Passengers</dt>
                <dd className="font-medium text-navy-900">{summary.passengers}</dd>
              </div>
              {summary.aircraft ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-400">Aircraft</dt>
                  <dd className="font-medium text-navy-900">{summary.aircraft}</dd>
                </div>
              ) : null}
              {summary.price ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-400">Price</dt>
                  <dd className="font-medium text-navy-900">{summary.price}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-sm leading-relaxed text-slate-600">
              You&apos;re accepting quote <span className="font-medium text-navy-900">{quoteNumber}</span> under
              the terms quoted.
            </p>
          )}

          <p className="text-sm leading-relaxed text-slate-600">
            Accepting this proposal creates your charter reservation. You will then continue to payment.
            No payment is taken by accepting this proposal.
          </p>
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
            {isPending ? "Accepting…" : "Accept & continue"}
          </Button>
        </div>
      </Modal>

      {/* Decline modal */}
      <Modal open={dialog === "decline"} onClose={closeDialog} title="Decline this proposal?" maxWidth="md">
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
            {isPending ? "Declining…" : "Decline proposal"}
          </Button>
        </div>
      </Modal>
    </>
  );
}