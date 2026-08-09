"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";
import { Modal } from "@/components/shared/modals/Modal";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/forms/Textarea";
import { InlineAlert } from "@/components/shared/alert/InlineAlert";
import { adminUpdateBookingStatus, adminCancelBooking } from "@/features/admin/actions/booking.actions";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/database/constants/booking-status";

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function BookingStatusActions({
  bookingId,
  currentStatus,
  balanceAmount,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
  /** Outstanding balance on the booking — drives whether "Mark as
   *  Confirmed" is offered as a normal action here. The server enforces
   *  the same rule independently (see transitionBookingStatus), so this
   *  is purely about presenting the right UI, not the actual guard. */
  balanceAmount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<BookingStatus | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Confirming a booking is only a normal, one-click action once payment
  // has actually brought the balance to zero — otherwise it would let an
  // admin talk an unpaid booking into "Confirmed" straight from the UI,
  // which is exactly what should only ever happen automatically via
  // successful M-Pesa payment. A pending booking that's already fully
  // paid but somehow didn't auto-confirm (e.g. a transient failure right
  // after payment) is the one legitimate exception, so that case is kept
  // available but called out as a recovery action rather than presented
  // as a routine step.
  const isAwaitingPayment = currentStatus === "pending" && balanceAmount > 0;
  const isRecoveryConfirm = currentStatus === "pending" && balanceAmount <= 0;

  const nextStatuses = ALLOWED_TRANSITIONS[currentStatus]
    .filter((s) => s !== "cancelled")
    .filter((s) => !(s === "confirmed" && isAwaitingPayment));
  const canCancel = ALLOWED_TRANSITIONS[currentStatus].includes("cancelled");

  function moveTo(status: BookingStatus) {
    setError(null);
    startTransition(async () => {
      const result = await adminUpdateBookingStatus(bookingId, status);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setConfirmTarget(null);
      router.refresh();
    });
  }

  function confirmCancel() {
    if (!cancelReason.trim()) {
      setError("Please provide a cancellation reason.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await adminCancelBooking(bookingId, cancelReason);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCancelOpen(false);
      setCancelReason("");
      router.refresh();
    });
  }

  if (nextStatuses.length === 0 && !canCancel && !isAwaitingPayment) {
    return <p className="text-sm text-slate-500">This booking is in a final state.</p>;
  }

  return (
    <div>
      {isAwaitingPayment ? (
        <div className="mb-4">
          <InlineAlert tone="pending">
            Awaiting payment — this booking will move to Confirmed automatically once the outstanding
            balance is fully paid. No manual action is needed.
          </InlineAlert>
        </div>
      ) : null}

      {isRecoveryConfirm ? (
        <div className="mb-4">
          <InlineAlert tone="info">
            This booking is fully paid but wasn&apos;t confirmed automatically. Marking it as Confirmed
            here is a manual recovery action, not the normal flow.
          </InlineAlert>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {nextStatuses.map((status) => (
          <Button
            key={status}
            variant="primary"
            onClick={() => {
              setError(null);
              setConfirmTarget(status);
            }}
          >
            Mark as {BOOKING_STATUS_LABELS[status]}
          </Button>
        ))}
        {canCancel ? (
          <Button variant="ghost" onClick={() => setCancelOpen(true)} className="!text-red-600 hover:!bg-red-50">
            Cancel Booking
          </Button>
        ) : null}
      </div>

      {error && !confirmTarget && !cancelOpen ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <Modal
        open={confirmTarget !== null}
        onClose={() => (isPending ? null : setConfirmTarget(null))}
        title={confirmTarget ? `Mark this booking as ${BOOKING_STATUS_LABELS[confirmTarget]}?` : ""}
        maxWidth="md"
      >
        <p className="text-sm leading-relaxed text-slate-600">
          {confirmTarget === "completed"
            ? "This closes out the booking as complete. This cannot be undone."
            : `The customer and operations team will see this booking as ${
                confirmTarget ? BOOKING_STATUS_LABELS[confirmTarget] : ""
              } going forward.`}
        </p>

        {error ? <p className="mt-4 rounded-md bg-red-50 px-4 py-3.5 text-sm text-red-700">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmTarget(null)} disabled={isPending}>
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => confirmTarget && moveTo(confirmTarget)}
            disabled={isPending}
            icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {isPending ? "Updating…" : `Mark as ${confirmTarget ? BOOKING_STATUS_LABELS[confirmTarget] : ""}`}
          </Button>
        </div>
      </Modal>

      <Modal open={cancelOpen} onClose={() => (isPending ? null : setCancelOpen(false))} title="Cancel Booking" maxWidth="md">
        <FormField label="Cancellation reason" htmlFor="cancel-reason" required>
          <Textarea
            id="cancel-reason"
            rows={3}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
          />
        </FormField>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={isPending}>
            Back
          </Button>
          <Button
            variant="primary"
            className="!bg-red-600 hover:!bg-red-700"
            onClick={confirmCancel}
            disabled={isPending}
            icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {isPending ? "Cancelling…" : "Confirm Cancellation"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}