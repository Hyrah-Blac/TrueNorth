import { EmailLayout, EmailText, EmailButton, EmailDetailRow } from "./components/EmailLayout";

export interface QuoteApprovedProps {
  customerName: string;
  quoteNumber: string;
  quotedAmount: string;
  validUntil?: string;
  dashboardUrl: string;
}

export default function QuoteApproved({
  customerName,
  quoteNumber,
  quotedAmount,
  validUntil,
  dashboardUrl,
}: QuoteApprovedProps) {
  return (
    <EmailLayout previewText={`Your charter quote ${quoteNumber} is ready`} heading="Your charter quote is ready">
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        Good news — your charter request has been reviewed and approved. A booking has been
        created and is ready for payment.
      </EmailText>

      <EmailDetailRow label="Quote reference" value={quoteNumber} />
      <EmailDetailRow label="Quoted amount" value={quotedAmount} />
      {validUntil ? <EmailDetailRow label="Valid until" value={validUntil} /> : null}

      <EmailButton href={dashboardUrl}>View Booking & Pay</EmailButton>

      <EmailText>
        You can complete payment securely with M-Pesa from your dashboard. Your booking will be
        confirmed automatically once payment is received.
      </EmailText>
    </EmailLayout>
  );
}
