import { EmailLayout, EmailText, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface BookingCancelledProps {
  customerName: string;
  bookingNumber: string;
  cancellationReason: string;
  contact?: EmailContact;
}

export default function BookingCancelled({
  customerName,
  bookingNumber,
  cancellationReason,
  contact,
}: BookingCancelledProps) {
  return (
    <EmailLayout previewText={`Booking ${bookingNumber} has been cancelled`} heading="Booking cancelled" contact={contact}>
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