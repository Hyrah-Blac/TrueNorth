"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/forms/Textarea";
import { Button } from "@/components/shared/buttons/Button";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { requestBookingCancellation, requestBookingModification } from "@/features/booking/actions/booking.actions";

type PanelMode = "closed" | "cancel" | "modify";

export function BookingActionsPanel({
  bookingId,
  canCancel,
  cancellationAlreadyRequested,
  modificationAlreadyRequested,
}: {
  bookingId: string;
  canCancel: boolean;
  cancellationAlreadyRequested: boolean;
  modificationAlreadyRequested: boolean;
}) {
  const [mode, setMode] = useState<PanelMode>("closed");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!canCancel) return null;

  function submit() {
    if (!notes.trim()) {
      setFeedback("Please add a reason so our team has context.");
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result =
        mode === "cancel"
          ? await requestBookingCancellation(bookingId, { cancellationReason: notes })
          : await requestBookingModification(bookingId, { modificationNotes: notes });

      if (!result.success) {
        setFeedback(result.error);
        return;
      }

      setMode("closed");
      setNotes("");
    });
  }

  if (mode === "closed") {
    if (cancellationAlreadyRequested && modificationAlreadyRequested) return null;

    return (
      <div className="flex flex-wrap items-center gap-3">
        {!cancellationAlreadyRequested ? (
          <Button variant="ghost" onClick={() => setMode("cancel")}>
            Request Cancellation
          </Button>
        ) : (
          <InlineAlert tone="neutral">
            Cancellation requested — our team will follow up shortly.
          </InlineAlert>
        )}
        {!modificationAlreadyRequested ? (
          <Button variant="ghost" onClick={() => setMode("modify")}>
            Request Modification
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <FormField
        label={mode === "cancel" ? "Reason for cancellation" : "What would you like to change?"}
        htmlFor="booking-action-notes"
        required
      >
        <Textarea
          id="booking-action-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </FormField>

      {feedback ? (
        <div className="mt-3">
          <InlineAlert tone="error">{feedback}</InlineAlert>
        </div>
      ) : null}

      <div className="mt-5 flex gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={submit}
          disabled={isPending}
          icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
        >
          {isPending ? "Submitting…" : mode === "cancel" ? "Confirm Cancellation Request" : "Submit Request"}
        </Button>
        <Button variant="ghost" size="md" onClick={() => setMode("closed")} disabled={isPending}>
          Back
        </Button>
      </div>
    </div>
  );
}
