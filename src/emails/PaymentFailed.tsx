import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface PaymentFailedProps {
  customerName: string;
  paymentNumber: string;
  bookingNumber: string;
  amount: string;
  /** e.g. "M-Pesa" or "Card" — which method the attempt used. */
  methodLabel: string;
  /** Where the customer can try again — the booking's payment panel. */
  retryUrl: string;
  contact?: EmailContact;
}

/**
 * Sent once a payment attempt is confirmed unsuccessful — see
 * notifyPaymentFailed.ts for when this fires and why. Deliberately
 * does not surface the internal failureReason/gateway response text:
 * that's operational detail, not something a customer needs to
 * self-diagnose. The booking itself is untouched by a failed
 * attempt, so the message stays calm and points straight at retrying.
 */
export default function PaymentFailed({
  customerName,
  paymentNumber,
  bookingNumber,
  amount,
  methodLabel,
  retryUrl,
  contact,
}: PaymentFailedProps) {
  return (
    <EmailLayout
      previewText={`Payment unsuccessful — ${paymentNumber}`}
      heading="Payment unsuccessful"
      contact={contact}
    >
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        We weren&apos;t able to complete this payment. Your booking is unaffected, and no funds were
        captured — you&apos;re welcome to try again whenever you&apos;re ready.
      </EmailText>

      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Payment reference" value={paymentNumber} />
      <EmailDetailRow label="Amount" value={amount} />
      <EmailDetailRow label="Payment method" value={methodLabel} />

      <EmailButton href={retryUrl}>Try Payment Again</EmailButton>

      <EmailText>
        If this keeps happening, reply to this email and our team will help you complete payment
        another way.
      </EmailText>
    </EmailLayout>
  );
}
