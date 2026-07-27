import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface PaymentReceiptProps {
  customerName: string;
  paymentNumber: string;
  bookingNumber: string;
  amount: string;
  mpesaReceiptNumber?: string;
  transactionDate: string;
  receiptUrl: string;
  contact?: EmailContact;
}

export default function PaymentReceipt({
  customerName,
  paymentNumber,
  bookingNumber,
  amount,
  mpesaReceiptNumber,
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
      {mpesaReceiptNumber ? <EmailDetailRow label="M-Pesa receipt" value={mpesaReceiptNumber} /> : null}
      <EmailDetailRow label="Date" value={transactionDate} />

      <EmailButton href={receiptUrl}>View Full Receipt</EmailButton>
    </EmailLayout>
  );
}