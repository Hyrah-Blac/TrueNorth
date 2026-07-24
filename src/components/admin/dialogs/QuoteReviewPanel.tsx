"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";
import { ApproveQuoteDialog } from "@/components/admin/dialogs/ApproveQuoteDialog";
import { RejectQuoteDialog } from "@/components/admin/dialogs/RejectQuoteDialog";
import type { AircraftOption } from "@/components/quote/steps/MissionAircraftStep";

export function QuoteReviewPanel({
  quoteId,
  aircraftOptions,
  preferredAircraftId,
}: {
  quoteId: string;
  aircraftOptions: AircraftOption[];
  preferredAircraftId?: string;
}) {
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);

  return (
    <>
      <div className="flex gap-3">
        <Button variant="primary" onClick={() => setDialog("approve")} icon={<Check className="h-4 w-4" />}>
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
    </>
  );
}
