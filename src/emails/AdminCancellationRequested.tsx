import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface AdminCancellationRequestedProps {
  bookingNumber: string;
  customerName: string;
  reason: string;
  adminUrl: string;
  contact?: EmailContact;
}

export default function AdminCancellationRequested({
  bookingNumber,
  customerName,
  reason,
  adminUrl,
  contact,
}: AdminCancellationRequestedProps) {
  return (
    <EmailLayout
      previewText={`Cancellation requested for booking ${bookingNumber}`}
      heading="Customer requested a cancellation"
      contact={contact}
    >
      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Customer" value={customerName} />
      <EmailDetailRow label="Reason given" value={reason} />

      <EmailButton href={adminUrl}>Review Booking</EmailButton>
      <EmailText>
        The booking has not been cancelled yet — this is a request. Review it and cancel from the admin
        dashboard if appropriate.
      </EmailText>
    </EmailLayout>
  );
}
