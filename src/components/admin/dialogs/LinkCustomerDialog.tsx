"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Link2 } from "lucide-react";
import { Modal } from "@/components/shared/modals/Modal";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/buttons/Button";
import { linkQuoteCustomerSchema, type LinkQuoteCustomerInput } from "@/features/quote/schemas/quote.schema";
import { adminLinkQuoteCustomer } from "@/features/admin/actions/quote.actions";

export function LinkCustomerDialog({
  open,
  onClose,
  quoteId,
  suggestedEmail,
}: {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  suggestedEmail?: string;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LinkQuoteCustomerInput>({
    resolver: zodResolver(linkQuoteCustomerSchema),
    defaultValues: { quoteId, email: suggestedEmail ?? "" },
  });

  async function onSubmit(data: LinkQuoteCustomerInput) {
    setSubmitError(null);
    const result = await adminLinkQuoteCustomer(data);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title="Link Customer Account" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-sm text-slate-600">
          This request has no linked customer account, so it can&apos;t be approved into a
          booking yet. Enter the email of an existing account to attach it — the customer needs
          to have signed up already.
        </p>

        <FormField label="Customer email" htmlFor="email" required error={errors.email?.message}>
          <TextInput id="email" type="email" hasError={Boolean(errors.email)} {...register("email")} />
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
            icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          >
            {isSubmitting ? "Linking…" : "Link Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}