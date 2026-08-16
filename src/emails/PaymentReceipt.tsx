import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface PaymentReceiptProps {
  customerName: string;
  paymentNumber: string;
  bookingNumber: string;
  amount: string;
  /** e.g. "M-Pesa" or "Card" — how the customer paid. */
  methodLabel: string;
  /** The provider's own reference for this transaction (M-Pesa receipt number or Paystack reference). */
  providerReference?: string;
  transactionDate: string;
  receiptUrl: string;
  contact?: EmailContact;
}

export default function PaymentReceipt({
  customerName,
  paymentNumber,
  bookingNumber,
  amount,
  methodLabel,
  providerReference,
  transactionDate,
  receiptUrl,
  contact,
}: PaymentReceiptProps) {
  return (
    <EmailLayout previewText={`Payment received — ${paymentNumber}`} heading="Payment received" contact={contact}>
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>We&apos;ve received your payment. Here&apos;s your receipt for your records.</EmailText>

      <EmailDetailRow label="Payment reference" value={paymentNumber} />
      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Amount paid" value={amount} />
      <EmailDetailRow label="Payment method" value={methodLabel} />
      {providerReference ? <EmailDetailRow label="Transaction reference" value={providerReference} /> : null}
      <EmailDetailRow label="Date" value={transactionDate} />

      <EmailButton href={receiptUrl}>View Full Receipt</EmailButton>
    </EmailLayout>
  );
}