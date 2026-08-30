import { EmailLayout, EmailText, EmailButton, EmailDetailRow, EmailRoute, type EmailContact } from "./components/EmailLayout";

export interface AdminNewQuoteProps {
  quoteNumber: string;
  contactName: string;
  contactEmail: string;
  missionType: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureAirportName?: string;
  destinationAirportName?: string;
  departureDate: string;
  adminUrl: string;
  contact?: EmailContact;
}

export default function AdminNewQuote({
  quoteNumber,
  contactName,
  contactEmail,
  missionType,
  departureAirportCode,
  destinationAirportCode,
  departureAirportName,
  destinationAirportName,
  departureDate,
  adminUrl,
  contact,
}: AdminNewQuoteProps) {
  return (
    <EmailLayout previewText={`New charter request: ${quoteNumber}`} heading="New charter request received" contact={contact}>
      <EmailDetailRow label="Quote reference" value={quoteNumber} />
      <EmailDetailRow label="Requested by" value={`${contactName} (${contactEmail})`} />
      <EmailDetailRow label="Mission type" value={missionType} />
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
      <EmailDetailRow label="Departure" value={departureDate} />

      <EmailButton href={adminUrl}>Review Request</EmailButton>
      <EmailText>This request is awaiting aircraft assignment and pricing.</EmailText>
    </EmailLayout>
  );
}