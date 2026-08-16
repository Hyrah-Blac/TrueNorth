import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface ModificationRequestReceivedProps {
  customerName: string;
  bookingNumber: string;
  notes: string;
  dashboardUrl: string;
  contact?: EmailContact;
}

/**
 * Sent to the customer the moment they submit a modification request —
 * a receipt that the request landed, not confirmation that the change
 * has been made. Changes to a confirmed itinerary/aircraft/pricing
 * stay a staff-reviewed follow-up, the same way cancellation is.
 */
export default function ModificationRequestReceived({
  customerName,
  bookingNumber,
  notes,
  dashboardUrl,
  contact,
}: ModificationRequestReceivedProps) {
  return (
    <EmailLayout
      previewText={`We've received your change request for ${bookingNumber}`}
      heading="Change request received"
      contact={contact}
    >
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        We&apos;ve received your requested change to this booking. Nothing has changed yet — our team
        will review your request and follow up shortly.
      </EmailText>

      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Requested change" value={notes} />

      <EmailButton href={dashboardUrl}>View Booking</EmailButton>
    </EmailLayout>
  );
}
