import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface BookingCreatedProps {
  customerName: string;
  bookingNumber: string;
  aircraftName: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  totalAmount: string;
  dashboardUrl: string;
  contact?: EmailContact;
}

export default function BookingCreated({
  customerName,
  bookingNumber,
  aircraftName,
  departureAirportCode,
  destinationAirportCode,
  departureDate,
  totalAmount,
  dashboardUrl,
  contact,
}: BookingCreatedProps) {
  return (
    <EmailLayout
      previewText={`Booking ${bookingNumber} created — payment required`}
      heading="Your booking has been created"
      contact={contact}
    >
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        Thanks for accepting your quote — your booking is set up. One step remains: complete
        payment to confirm it.
      </EmailText>

      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Aircraft" value={aircraftName} />
      <EmailDetailRow label="Route" value={`${departureAirportCode} → ${destinationAirportCode}`} />
      <EmailDetailRow label="Departure" value={departureDate} />
      <EmailDetailRow label="Total" value={totalAmount} />

      <EmailButton href={dashboardUrl}>Pay & Confirm Booking</EmailButton>
    </EmailLayout>
  );
}
