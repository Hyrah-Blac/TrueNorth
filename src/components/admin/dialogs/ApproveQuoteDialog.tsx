"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Modal } from "@/components/shared/modals/Modal";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Button } from "@/components/shared/buttons/Button";
import { approveQuoteSchema, type ApproveQuoteInput } from "@/features/quote/schemas/quote.schema";
import { adminApproveQuote } from "@/features/admin/actions/quote.actions";
import type { AircraftOption } from "@/components/quote/steps/MissionAircraftStep";

export function ApproveQuoteDialog({
  open,
  onClose,
  quoteId,
  aircraftOptions,
  preferredAircraftId,
}: {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  aircraftOptions: AircraftOption[];
  preferredAircraftId?: string;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApproveQuoteInput>({
    resolver: zodResolver(approveQuoteSchema),
    defaultValues: { quoteId, aircraftId: preferredAircraftId, quotedCurrency: "KES" },
  });

  async function onSubmit(data: ApproveQuoteInput) {
    setSubmitError(null);
    const result = await adminApproveQuote(data);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    onClose();
    router.push(`/admin/bookings/${result.data.bookingId}`);
  }

  return (
    <Modal open={open} onClose={onClose} title="Approve Charter Request">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Aircraft" htmlFor="aircraftId" required error={errors.aircraftId?.message}>
          <Select id="aircraftId" defaultValue={preferredAircraftId ?? ""} {...register("aircraftId")}>
            <option value="" disabled>
              Select aircraft
            </option>
            {aircraftOptions.map((aircraft) => (
              <option key={aircraft._id} value={aircraft._id}>
                {aircraft.name}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Quoted amount (KES)" htmlFor="quotedAmount" required error={errors.quotedAmount?.message}>
            <TextInput id="quotedAmount" type="number" min={1} {...register("quotedAmount", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Valid until" htmlFor="validUntil" hint="Optional">
            <TextInput
              id="validUntil"
              type="date"
              {...register("validUntil", {
                setValueAs: (value) => (value === "" ? undefined : value),
              })}
            />
          </FormField>
        </div>

        <FormField label="Internal notes" htmlFor="adminNotes" hint="Not visible to the customer">
          <Textarea id="adminNotes" rows={3} {...register("adminNotes")} />
        </FormField>

        {submitError ? <p className="rounded-md bg-red-50 px-4 py-3.5 text-sm text-red-700">{submitError}</p> : null}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          >
            {isSubmitting ? "Approving…" : "Approve & Create Booking"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
