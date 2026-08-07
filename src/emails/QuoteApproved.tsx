import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface QuoteApprovedProps {
  customerName: string;
  quoteNumber: string;
  quotedAmount: string;
  validUntil?: string;
  quoteUrl: string;
  contact?: EmailContact;
}

export default function QuoteApproved({
  customerName,
  quoteNumber,
  quotedAmount,
  validUntil,
  quoteUrl,
  contact,
}: QuoteApprovedProps) {
  return (
    <EmailLayout
      previewText={`Your charter quote ${quoteNumber} is ready`}
      heading="Your charter quote is ready"
      contact={contact}
    >
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        Good news — your charter request has been reviewed and priced. Please review the details
        below and let us know whether you&apos;d like to proceed.
      </EmailText>

      <EmailDetailRow label="Quote reference" value={quoteNumber} />
      <EmailDetailRow label="Quoted amount" value={quotedAmount} />
      {validUntil ? <EmailDetailRow label="Valid until" value={validUntil} /> : null}

      <EmailButton href={quoteUrl}>Review & Respond</EmailButton>

      <EmailText>
        Accepting the quote creates your booking and moves you to payment. If the terms
        don&apos;t work for you, you can decline it from the same page.
      </EmailText>
    </EmailLayout>
  );
}
