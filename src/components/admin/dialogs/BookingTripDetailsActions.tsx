"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PencilSimple } from "@phosphor-icons/react";
import { Button } from "@/components/shared/buttons/Button";
import { Modal } from "@/components/shared/modals/Modal";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { adminUpdateBookingTripDetails } from "@/features/admin/actions/booking.actions";

export interface BookingTripDetails {
  departureTime?: string;
  fboName?: string;
  fboAddress?: string;
  groundContactPhone?: string;
}

/**
 * Lets ops fill in / edit the day-of-travel logistics (departure time,
 * FBO, ground contact) that aren't known at booking creation but are
 * what the customer actually needs before showing up. Surfaced on the
 * customer booking page, the digital ticket, and the reminder email
 * once set — see adminUpdateBookingTripDetails.
 */
export function BookingTripDetailsActions({
  bookingId,
  details,
}: {
  bookingId: string;
  details: BookingTripDetails;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [departureTime, setDepartureTime] = useState(details.departureTime ?? "");
  const [fboName, setFboName] = useState(details.fboName ?? "");
  const [fboAddress, setFboAddress] = useState(details.fboAddress ?? "");
  const [groundContactPhone, setGroundContactPhone] = useState(details.groundContactPhone ?? "");

  function openDialog() {
    // Reset to the latest saved values each time the dialog opens, in
    // case another admin updated this booking since the page loaded.
    setDepartureTime(details.departureTime ?? "");
    setFboName(details.fboName ?? "");
    setFboAddress(details.fboAddress ?? "");
    setGroundContactPhone(details.groundContactPhone ?? "");
    setError(null);
    setOpen(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await adminUpdateBookingTripDetails(bookingId, {
        departureTime,
        fboName,
        fboAddress,
        groundContactPhone,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  const hasAnyDetail = Boolean(
    details.departureTime || details.fboName || details.fboAddress || details.groundContactPhone
  );

  return (
    <div>
      {hasAnyDetail ? (
        <dl className="space-y-2.5 text-sm">
          {details.departureTime ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Departure time</dt>
              <dd className="font-medium text-navy-900">{details.departureTime}</dd>
            </div>
          ) : null}
          {details.fboName ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">FBO / Terminal</dt>
              <dd className="text-right font-medium text-navy-900">{details.fboName}</dd>
            </div>
          ) : null}
          {details.fboAddress ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">FBO address</dt>
              <dd className="text-right text-navy-900">{details.fboAddress}</dd>
            </div>
          ) : null}
          {details.groundContactPhone ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ground contact</dt>
              <dd className="font-medium text-navy-900">{details.groundContactPhone}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="text-sm text-slate-500">Not set yet — the customer won&apos;t see a day-of-travel panel until this is filled in.</p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="mt-4 gap-1.5"
        onClick={openDialog}
        icon={<PencilSimple className="h-3.5 w-3.5" aria-hidden="true" />}
      >
        {hasAnyDetail ? "Edit details" : "Add details"}
      </Button>

      <Modal
        open={open}
        onClose={() => (isPending ? null : setOpen(false))}
        title="Day-of-travel details"
        maxWidth="md"
      >
        <p className="text-sm leading-relaxed text-slate-600">
          Shown to the customer on their booking page, digital ticket, and departure reminder once saved.
        </p>

        <div className="mt-5 space-y-4">
          <FormField label="Departure time" htmlFor="departureTime" hint="Local time, e.g. 09:30">
            <TextInput
              id="departureTime"
              value={departureTime}
              onChange={(event) => setDepartureTime(event.target.value)}
              disabled={isPending}
            />
          </FormField>
          <FormField label="FBO / Terminal name" htmlFor="fboName">
            <TextInput
              id="fboName"
              value={fboName}
              onChange={(event) => setFboName(event.target.value)}
              disabled={isPending}
            />
          </FormField>
          <FormField label="FBO address" htmlFor="fboAddress">
            <TextInput
              id="fboAddress"
              value={fboAddress}
              onChange={(event) => setFboAddress(event.target.value)}
              disabled={isPending}
            />
          </FormField>
          <FormField label="Ground contact phone" htmlFor="groundContactPhone">
            <TextInput
              id="groundContactPhone"
              value={groundContactPhone}
              onChange={(event) => setGroundContactPhone(event.target.value)}
              disabled={isPending}
            />
          </FormField>
        </div>

        {error ? <p className="mt-4 rounded-md bg-red-50 px-4 py-3.5 text-sm text-red-700">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={save}
            disabled={isPending}
            icon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {isPending ? "Saving…" : "Save details"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
