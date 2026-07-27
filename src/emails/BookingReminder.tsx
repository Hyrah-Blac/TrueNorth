import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface BookingReminderProps {
  customerName: string;
  bookingNumber: string;
  aircraftName: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  dashboardUrl: string;
  contact?: EmailContact;
}

export default function BookingReminder({
  customerName,
  bookingNumber,
  aircraftName,
  departureAirportCode,
  destinationAirportCode,
  departureDate,
  dashboardUrl,
  contact,
}: BookingReminderProps) {
  return (
    <EmailLayout previewText={`Reminder: your charter departs soon`} heading="Your charter departs soon" contact={contact}>
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>This is a reminder that your charter is coming up.</EmailText>

      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Aircraft" value={aircraftName} />
      <EmailDetailRow label="Route" value={`${departureAirportCode} → ${destinationAirportCode}`} />
      <EmailDetailRow label="Departure" value={departureDate} />

      <EmailButton href={dashboardUrl}>View Booking Details</EmailButton>

      <EmailText>
        Please arrive at the terminal at least 45 minutes before departure. Contact our
        operations desk if your plans have changed.
      </EmailText>
    </EmailLayout>
  );
}