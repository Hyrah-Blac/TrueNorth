import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface AdminQuoteAcceptanceConflictProps {
  quoteNumber: string;
  customerName: string;
  aircraftName: string;
  reason: string;
  adminUrl: string;
  contact?: EmailContact;
}

/**
 * Sent when a customer tried to accept an approved quote and the
 * final, atomic aircraft-availability check rejected it (see
 * acceptQuoteById in acceptQuote.ts) — most often because the same
 * aircraft/slot ended up promised to two approved quotes at once. The
 * customer sees a generic "please contact us" message with no
 * internal details; this email gives ops the specifics so they can
 * reach out proactively instead of waiting for the customer to.
 */
export default function AdminQuoteAcceptanceConflict({
  quoteNumber,
  customerName,
  aircraftName,
  reason,
  adminUrl,
  contact,
}: AdminQuoteAcceptanceConflictProps) {
  return (
    <EmailLayout
      previewText={`Customer could not accept quote ${quoteNumber} — aircraft conflict`}
      heading="A customer's quote acceptance was blocked"
      contact={contact}
    >
      <EmailDetailRow label="Quote reference" value={quoteNumber} />
      <EmailDetailRow label="Customer" value={customerName} />
      <EmailDetailRow label="Aircraft" value={aircraftName} />
      <EmailDetailRow label="Reason" value={reason} />

      <EmailButton href={adminUrl}>Review Quote</EmailButton>
      <EmailText>
        The customer saw a generic message and no booking was created — no payment was affected. Please
        reach out to them directly and either reassign an available aircraft or re-approve the quote with
        a new slot.
      </EmailText>
    </EmailLayout>
  );
}