import { EmailLayout, EmailText, EmailDetailRow } from "./components/EmailLayout";

export interface BookingCancelledProps {
  customerName: string;
  bookingNumber: string;
  cancellationReason: string;
}

export default function BookingCancelled({ customerName, bookingNumber, cancellationReason }: BookingCancelledProps) {
  return (
    <EmailLayout previewText={`Booking ${bookingNumber} has been cancelled`} heading="Booking cancelled">
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>Your booking has been cancelled. Details are below for your records.</EmailText>

      <EmailDetailRow label="Booking reference" value={bookingNumber} />

      <EmailText>
        <strong>Reason: </strong>
        {cancellationReason}
      </EmailText>

      <EmailText>
        If you have any questions about this cancellation, or if any payments need to be
        refunded, please contact our operations team directly.
      </EmailText>
    </EmailLayout>
  );
}
