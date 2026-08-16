import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface CancellationRequestReceivedProps {
  customerName: string;
  bookingNumber: string;
  reason: string;
  dashboardUrl: string;
  contact?: EmailContact;
}

/**
 * Sent to the customer the moment they submit a cancellation request —
 * a receipt that the request landed, not a confirmation that the
 * booking is cancelled. The booking itself is only ever cancelled by
 * a staff-reviewed action (see cancelBooking in transitions.ts), which
 * already sends its own BookingCancelled email once that happens.
 */
export default function CancellationRequestReceived({
  customerName,
  bookingNumber,
  reason,
  dashboardUrl,
  contact,
}: CancellationRequestReceivedProps) {
  return (
    <EmailLayout
      previewText={`We've received your cancellation request for ${bookingNumber}`}
      heading="Cancellation request received"
      contact={contact}
    >
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        We&apos;ve received your request to cancel this booking. Your booking has not been cancelled
        yet — our team will review your request and follow up shortly.
      </EmailText>

      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Reason given" value={reason} />

      <EmailButton href={dashboardUrl}>View Booking</EmailButton>
    </EmailLayout>
  );
}
