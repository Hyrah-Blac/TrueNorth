import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface BookingCompletedProps {
  customerName: string;
  bookingNumber: string;
  aircraftName: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  dashboardUrl: string;
  contact?: EmailContact;
}

export default function BookingCompleted({
  customerName,
  bookingNumber,
  aircraftName,
  departureAirportCode,
  destinationAirportCode,
  dashboardUrl,
  contact,
}: BookingCompletedProps) {
  return (
    <EmailLayout
      previewText={`Booking ${bookingNumber} is complete`}
      heading="Thanks for flying with us"
      contact={contact}
    >
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        Your charter is complete. We hope it was a great trip — here are the details for your
        records.
      </EmailText>

      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Aircraft" value={aircraftName} />
      <EmailDetailRow label="Route" value={`${departureAirportCode} → ${destinationAirportCode}`} />

      <EmailButton href={dashboardUrl}>View Booking</EmailButton>

      <EmailText>We&apos;d love to fly you again — reach out any time you&apos;re ready to book.</EmailText>
    </EmailLayout>
  );
}
