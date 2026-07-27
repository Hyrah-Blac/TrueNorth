"use client";

import { useState } from "react";
import { Check, X, Link2 } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";
import { ApproveQuoteDialog } from "@/components/admin/dialogs/ApproveQuoteDialog";
import { RejectQuoteDialog } from "@/components/admin/dialogs/RejectQuoteDialog";
import { LinkCustomerDialog } from "@/components/admin/dialogs/LinkCustomerDialog";
import type { AircraftOption } from "@/components/quote/steps/MissionAircraftStep";

export function QuoteReviewPanel({
  quoteId,
  aircraftOptions,
  preferredAircraftId,
  hasCustomer,
  suggestedEmail,
}: {
  quoteId: string;
  aircraftOptions: AircraftOption[];
  preferredAircraftId?: string;
  hasCustomer: boolean;
  suggestedEmail?: string;
}) {
  const [dialog, setDialog] = useState<"approve" | "reject" | "link" | null>(null);

  return (
    <>
      {!hasCustomer ? (
        <div className="mb-4 rounded-lg border border-gold-200 bg-gold-200/10 p-4 text-sm text-slate-600">
          <p>
            No customer account is linked to this request yet, so it can&apos;t be approved into a
            booking.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-3 !px-0 !text-sky-600 hover:!bg-transparent hover:!text-sky-700"
            onClick={() => setDialog("link")}
            icon={<Link2 className="h-4 w-4" />}
          >
            Link customer account
          </Button>
        </div>
      ) : null}

      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={() => setDialog("approve")}
          disabled={!hasCustomer}
          icon={<Check className="h-4 w-4" />}
        >
          Approve
        </Button>
        <Button
          variant="ghost"
          onClick={() => setDialog("reject")}
          className="!text-red-600 hover:!bg-red-50"
          icon={<X className="h-4 w-4" />}
        >
          Reject
        </Button>
      </div>

      <ApproveQuoteDialog
        open={dialog === "approve"}
        onClose={() => setDialog(null)}
        quoteId={quoteId}
        aircraftOptions={aircraftOptions}
        preferredAircraftId={preferredAircraftId}
      />

      <RejectQuoteDialog open={dialog === "reject"} onClose={() => setDialog(null)} quoteId={quoteId} />

      <LinkCustomerDialog
        open={dialog === "link"}
        onClose={() => setDialog(null)}
        quoteId={quoteId}
        suggestedEmail={suggestedEmail}
      />
    </>
  );
}