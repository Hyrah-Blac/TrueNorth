import { EmailLayout, EmailText, EmailButton, EmailDetailRow, type EmailContact } from "./components/EmailLayout";

export interface TicketConfirmationProps {
  customerName: string;
  ticketNumber: string;
  bookingNumber: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  passengerCount: number;
  aircraftName?: string;
  amountPaid: string;
  viewTicketUrl: string;
  downloadTicketUrl: string;
  contact?: EmailContact;
}

export default function TicketConfirmation({
  customerName,
  ticketNumber,
  bookingNumber,
  departureAirportCode,
  destinationAirportCode,
  departureDate,
  passengerCount,
  aircraftName,
  amountPaid,
  viewTicketUrl,
  downloadTicketUrl,
  contact,
}: TicketConfirmationProps) {
  return (
    <EmailLayout
      previewText={`Your charter is confirmed — Ticket ${ticketNumber}`}
      heading="Your charter is confirmed"
      contact={contact}
    >
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>
        Your payment has been verified and your charter ticket is ready. It&apos;s attached to this email as a
        PDF, and you can also view or download it any time from your dashboard.
      </EmailText>

      <EmailDetailRow label="Ticket" value={ticketNumber} />
      <EmailDetailRow label="Booking" value={bookingNumber} />
      <EmailDetailRow label="Route" value={`${departureAirportCode} → ${destinationAirportCode}`} />
      <EmailDetailRow label="Date" value={departureDate} />
      <EmailDetailRow label="Passengers" value={String(passengerCount)} />
      {aircraftName ? <EmailDetailRow label="Aircraft" value={aircraftName} /> : null}
      <EmailDetailRow label="Payment" value={`PAID — ${amountPaid}`} />

      <EmailButton href={viewTicketUrl}>View Ticket</EmailButton>
      <EmailButton href={downloadTicketUrl}>Download Ticket</EmailButton>

      <EmailText>
        Your ticket includes a secure QR code that can be scanned to verify it&apos;s a valid, paid charter
        ticket.
      </EmailText>
    </EmailLayout>
  );
}
