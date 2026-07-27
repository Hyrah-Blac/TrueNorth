import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface BookingConfirmationProps {
  customerName: string;
  bookingNumber: string;
  aircraftName: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  passengerCount: number;
  totalAmount: string;
  dashboardUrl: string;
  contact?: EmailContact;
}

export default function BookingConfirmation({
  customerName,
  bookingNumber,
  aircraftName,
  departureAirportCode,
  destinationAirportCode,
  departureDate,
  passengerCount,
  totalAmount,
  dashboardUrl,
  contact,
}: BookingConfirmationProps) {
  return (
    <EmailLayout previewText={`Booking ${bookingNumber} is confirmed`} heading="Your booking is confirmed" contact={contact}>
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        Your charter booking is confirmed. Here are the details for your records — you can also
        view this booking and its timeline any time from your dashboard.
      </EmailText>

      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Aircraft" value={aircraftName} />
      <EmailDetailRow label="Route" value={`${departureAirportCode} → ${destinationAirportCode}`} />
      <EmailDetailRow label="Departure" value={departureDate} />
      <EmailDetailRow label="Passengers" value={String(passengerCount)} />
      <EmailDetailRow label="Total" value={totalAmount} />

      <EmailButton href={dashboardUrl}>View Booking</EmailButton>

      <EmailText>
        If anything about your trip changes, you can request a modification or cancellation
        directly from your dashboard, and our operations team will follow up.
      </EmailText>
    </EmailLayout>
  );
}