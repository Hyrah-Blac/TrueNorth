import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface AdminQuoteDeclinedProps {
  quoteNumber: string;
  customerName: string;
  quotedAmount: string;
  reason?: string;
  adminUrl: string;
  contact?: EmailContact;
}

export default function AdminQuoteDeclined({
  quoteNumber,
  customerName,
  quotedAmount,
  reason,
  adminUrl,
  contact,
}: AdminQuoteDeclinedProps) {
  return (
    <EmailLayout
      previewText={`Quote ${quoteNumber} was declined by the customer`}
      heading="Customer declined a quote"
      contact={contact}
    >
      <EmailDetailRow label="Quote reference" value={quoteNumber} />
      <EmailDetailRow label="Customer" value={customerName} />
      <EmailDetailRow label="Quoted amount" value={quotedAmount} />
      {reason ? <EmailDetailRow label="Reason given" value={reason} /> : null}

      <EmailButton href={adminUrl}>View in Admin Dashboard</EmailButton>
      <EmailText>This is an automated notification for the operations team.</EmailText>
    </EmailLayout>
  );
}
