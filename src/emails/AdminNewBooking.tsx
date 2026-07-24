import { EmailLayout, EmailText, EmailButton, EmailDetailRow } from "./components/EmailLayout";

export interface AdminNewBookingProps {
  bookingNumber: string;
  customerName: string;
  aircraftName: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  totalAmount: string;
  adminUrl: string;
}

export default function AdminNewBooking({
  bookingNumber,
  customerName,
  aircraftName,
  departureAirportCode,
  destinationAirportCode,
  totalAmount,
  adminUrl,
}: AdminNewBookingProps) {
  return (
    <EmailLayout previewText={`New booking: ${bookingNumber}`} heading="New booking created">
      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Customer" value={customerName} />
      <EmailDetailRow label="Aircraft" value={aircraftName} />
      <EmailDetailRow label="Route" value={`${departureAirportCode} → ${destinationAirportCode}`} />
      <EmailDetailRow label="Total" value={totalAmount} />

      <EmailButton href={adminUrl}>View in Admin Dashboard</EmailButton>
      <EmailText>This is an automated notification for the operations team.</EmailText>
    </EmailLayout>
  );
}
