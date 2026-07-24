"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Modal } from "@/components/shared/modals/Modal";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/forms/Textarea";
import { Button } from "@/components/shared/buttons/Button";
import { rejectQuoteSchema, type RejectQuoteInput } from "@/features/quote/schemas/quote.schema";
import { adminRejectQuote } from "@/features/admin/actions/quote.actions";

export function RejectQuoteDialog({
  open,
  onClose,
  quoteId,
}: {
  open: boolean;
  onClose: () => void;
  quoteId: string;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RejectQuoteInput>({
    resolver: zodResolver(rejectQuoteSchema),
    defaultValues: { quoteId },
  });

  async function onSubmit(data: RejectQuoteInput) {
    setSubmitError(null);
    const result = await adminRejectQuote(data);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title="Reject Charter Request" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          label="Reason"
          htmlFor="rejectionReason"
          required
          hint="This will be visible to the customer"
          error={errors.rejectionReason?.message}
        >
          <Textarea id="rejectionReason" rows={4} hasError={Boolean(errors.rejectionReason)} {...register("rejectionReason")} />
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
            className="!bg-red-600 hover:!bg-red-700"
            icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          >
            {isSubmitting ? "Rejecting…" : "Reject Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
