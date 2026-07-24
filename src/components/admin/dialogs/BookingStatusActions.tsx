"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";
import { Modal } from "@/components/shared/modals/Modal";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/forms/Textarea";
import { adminUpdateBookingStatus, adminCancelBooking } from "@/features/admin/actions/booking.actions";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/database/constants/booking-status";

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function BookingStatusActions({ bookingId, currentStatus }: { bookingId: string; currentStatus: BookingStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const nextStatuses = ALLOWED_TRANSITIONS[currentStatus].filter((s) => s !== "cancelled");
  const canCancel = ALLOWED_TRANSITIONS[currentStatus].includes("cancelled");

  function moveTo(status: BookingStatus) {
    setError(null);
    startTransition(async () => {
      const result = await adminUpdateBookingStatus(bookingId, status);
      if (!result.success) {
        setError(result.error);
        return;
      }
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

  if (nextStatuses.length === 0 && !canCancel) {
    return <p className="text-sm text-slate-500">This booking is in a final state.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {nextStatuses.map((status) => (
          <Button
            key={status}
            variant="primary"
            onClick={() => moveTo(status)}
            disabled={isPending}
            icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
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

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Booking" maxWidth="md">
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
