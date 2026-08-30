import { EmailLayout, EmailText, EmailButton, EmailDetailRow, EmailRoute, type EmailContact } from "./components/EmailLayout";

export interface BookingReminderProps {
  customerName: string;
  bookingNumber: string;
  aircraftName: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureAirportName?: string;
  destinationAirportName?: string;
  departureDate: string;
  dashboardUrl: string;
  contact?: EmailContact;
  /** Local departure time, e.g. "09:30" — included only once ops has set it on the booking. */
  departureTime?: string;
  fboName?: string;
  fboAddress?: string;
  groundContactPhone?: string;
}

export default function BookingReminder({
  customerName,
  bookingNumber,
  aircraftName,
  departureAirportCode,
  destinationAirportCode,
  departureAirportName,
  destinationAirportName,
  departureDate,
  dashboardUrl,
  contact,
  departureTime,
  fboName,
  fboAddress,
  groundContactPhone,
}: BookingReminderProps) {
  return (
    <EmailLayout previewText={`Reminder: your charter departs soon`} heading="Your charter departs soon" contact={contact}>
      <EmailText>Hi {customerName},</EmailText>
      <EmailText>This is a reminder that your charter is coming up.</EmailText>

      <EmailDetailRow label="Booking reference" value={bookingNumber} />
      <EmailDetailRow label="Aircraft" value={aircraftName} />
      <EmailDetailRow
        label="Route"
        value={
          <EmailRoute
            departureCode={departureAirportCode}
            destinationCode={destinationAirportCode}
            departureName={departureAirportName}
            destinationName={destinationAirportName}
          />
        }
      />
      <EmailDetailRow
        label="Departure"
        value={departureTime ? `${departureDate} · ${departureTime} local` : departureDate}
      />
      {fboName ? (
        <EmailDetailRow label="FBO / Terminal" value={fboAddress ? `${fboName} — ${fboAddress}` : fboName} />
      ) : null}
      {groundContactPhone ? <EmailDetailRow label="Ground contact" value={groundContactPhone} /> : null}

      <EmailButton href={dashboardUrl}>View Booking Details</EmailButton>

      <EmailText>
        Please arrive at least 45 minutes before departure. Contact our operations desk if your
        plans have changed.
      </EmailText>
    </EmailLayout>
  );
}