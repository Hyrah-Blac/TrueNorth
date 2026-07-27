import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface QuoteRejectedProps {
  customerName: string;
  quoteNumber: string;
  rejectionReason: string;
  requestUrl: string;
  contact?: EmailContact;
}

export default function QuoteRejected({
  customerName,
  quoteNumber,
  rejectionReason,
  requestUrl,
  contact,
}: QuoteRejectedProps) {
  return (
    <EmailLayout
      previewText={`Update on your charter request ${quoteNumber}`}
      heading="Update on your charter request"
      contact={contact}
    >
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        We&apos;re unable to fulfil your charter request as submitted. Details are below.
      </EmailText>

      <EmailDetailRow label="Quote reference" value={quoteNumber} />

      <EmailText>
        <strong>Reason: </strong>
        {rejectionReason}
      </EmailText>

      <EmailButton href={requestUrl}>Submit a New Request</EmailButton>

      <EmailText>
        If you&apos;d like to discuss alternative dates, aircraft, or routing, our operations team is
        happy to help — just reply to this email.
      </EmailText>
    </EmailLayout>
  );
}