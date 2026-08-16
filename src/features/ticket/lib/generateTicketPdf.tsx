import "server-only";
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { siteConfig } from "@/lib/config/site";
import { formatDate } from "@/utils/date";
import { TICKET_STATUSES, TICKET_STATUS_LABELS, type TicketStatus } from "@/database/constants/ticket-status";

export interface TicketPdfData {
  ticketNumber: string;
  bookingNumber: string;
  passengerName: string;
  departureAirportCode: string;
  destinationAirportCode: string;
  departureDate: Date | string;
  passengerCount: number;
  aircraftName?: string;
  aircraftRegistration?: string;
  qrCodeDataUrl: string;
  verificationUrl: string;
  departureTime?: string;
  fboName?: string;
  fboAddress?: string;
  /** Defaults to "issued" if omitted, so existing callers that don't pass it keep getting the PAID IN FULL badge unchanged. */
  status?: TicketStatus;
}

// Brand colors pulled from src/styles/variables.css — kept as plain hex
// here since react-pdf renders independently of the site's Tailwind/CSS
// custom-property pipeline. Only built-in Helvetica weights are used
// (no custom font registration/network fetch), which keeps generation
// fast and works reliably in a serverless function.
const COLORS = {
  navy: "#0b1622",
  slate: "#475569",
  slateLight: "#94a3b8",
  champagne: "#c8a95b",
  border: "#e2e8f0",
  paidGreen: "#15803d",
  paidGreenBg: "#f0fdf4",
  invalidRed: "#b91c1c",
  invalidRedBg: "#fef2f2",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.navy,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: `2 solid ${COLORS.navy}`,
    paddingBottom: 16,
    marginBottom: 20,
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 8,
    color: COLORS.slate,
    marginTop: 3,
  },
  ticketLabel: {
    fontSize: 9,
    color: COLORS.champagne,
    letterSpacing: 2,
    textAlign: "right",
  },
  ticketNumber: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    textAlign: "right",
    marginTop: 3,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
  },
  routeCode: {
    fontFamily: "Helvetica-Bold",
    fontSize: 30,
  },
  routeArrow: {
    fontSize: 20,
    color: COLORS.champagne,
    marginHorizontal: 16,
  },
  bodyRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  detailsColumn: {
    flex: 1,
    paddingRight: 20,
  },
  qrColumn: {
    width: 150,
    alignItems: "center",
  },
  qrImage: {
    width: 130,
    height: 130,
  },
  qrCaption: {
    fontSize: 6.5,
    color: COLORS.slateLight,
    textAlign: "center",
    marginTop: 6,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailItem: {
    width: "50%",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 7.5,
    color: COLORS.slateLight,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  paidBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: COLORS.paidGreenBg,
    color: COLORS.paidGreen,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: `1 solid ${COLORS.border}`,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.slateLight,
    textAlign: "center",
    lineHeight: 1.5,
  },
});

/**
 * Generates the A4 charter ticket PDF as a Buffer, server-side, from
 * authoritative data the caller has already fetched from the
 * database (never from client-supplied fields) — see
 * app/api/tickets/[ticketId]/pdf/route.ts for the authorization and
 * data-loading side of this. Deliberately only shows information that
 * genuinely exists in the data model — departure time and FBO/terminal
 * render when ops has set them on the booking (see
 * BookingTripDetailsActions), and stay omitted otherwise rather than
 * showing an invented or placeholder value (see Phase 2 requirement #3).
 *
 * `status` defaults to "issued" when the caller doesn't pass it, so the
 * PDF always shows a valid-for-travel badge unless a cancelled or
 * invalidated ticket's status is explicitly threaded through — see the
 * matching non-issued alert on the web ticket page for the same rule
 * applied there.
 */
export async function generateTicketPdf(data: TicketPdfData): Promise<Buffer> {
  const status = data.status ?? TICKET_STATUSES.ISSUED;
  const isValid = status === TICKET_STATUSES.ISSUED;

  const doc = (
    <Document title={`${siteConfig.name} — ${data.ticketNumber}`} author={siteConfig.name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{siteConfig.name.toUpperCase()}</Text>
            <Text style={styles.tagline}>{siteConfig.tagline}</Text>
          </View>
          <View>
            <Text style={styles.ticketLabel}>CHARTER TICKET</Text>
            <Text style={styles.ticketNumber}>{data.ticketNumber}</Text>
          </View>
        </View>

        {/* Mirrors the "no longer valid for travel" alert already shown
            on the web ticket page for a non-issued ticket — a downloaded
            or printed PDF needs the same warning baked in, since it can
            be viewed offline long after the on-screen alert was seen. */}
        {!isValid ? (
          <View
            style={{
              backgroundColor: COLORS.invalidRedBg,
              borderRadius: 4,
              paddingVertical: 8,
              paddingHorizontal: 12,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: COLORS.invalidRed, fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 0.5 }}>
              {TICKET_STATUS_LABELS[status].toUpperCase()} — NOT VALID FOR TRAVEL
            </Text>
          </View>
        ) : null}

        <View style={styles.routeRow}>
          <Text style={styles.routeCode}>{data.departureAirportCode}</Text>
          <Text style={styles.routeArrow}>→</Text>
          <Text style={styles.routeCode}>{data.destinationAirportCode}</Text>
        </View>

        <View style={styles.bodyRow}>
          <View style={styles.detailsColumn}>
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PASSENGER</Text>
                <Text style={styles.detailValue}>{data.passengerName}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>BOOKING</Text>
                <Text style={styles.detailValue}>{data.bookingNumber}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>DEPARTURE DATE</Text>
                <Text style={styles.detailValue}>
                  {formatDate(data.departureDate)}
                  {data.departureTime ? ` · ${data.departureTime} local` : ""}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PASSENGERS</Text>
                <Text style={styles.detailValue}>
                  {data.passengerCount} {data.passengerCount === 1 ? "passenger" : "passengers"}
                </Text>
              </View>
              {data.fboName ? (
                <View style={{ ...styles.detailItem, width: "100%" }}>
                  <Text style={styles.detailLabel}>FBO / TERMINAL</Text>
                  <Text style={styles.detailValue}>{data.fboName}</Text>
                  {data.fboAddress ? (
                    <Text style={{ fontSize: 8.5, color: COLORS.slate, marginTop: 2 }}>{data.fboAddress}</Text>
                  ) : null}
                </View>
              ) : null}
              {data.aircraftName ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>AIRCRAFT</Text>
                  <Text style={styles.detailValue}>{data.aircraftName}</Text>
                </View>
              ) : null}
              {data.aircraftRegistration ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>REGISTRATION</Text>
                  <Text style={styles.detailValue}>{data.aircraftRegistration}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.detailLabel}>PAYMENT</Text>
            <Text
              style={
                isValid
                  ? styles.paidBadge
                  : { ...styles.paidBadge, backgroundColor: COLORS.invalidRedBg, color: COLORS.invalidRed }
              }
            >
              {isValid ? "PAID IN FULL" : TICKET_STATUS_LABELS[status].toUpperCase()}
            </Text>
          </View>

          <View style={styles.qrColumn}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- this is react-pdf's <Image> (PDF rendering primitive), not an HTML/next <img>; it has no alt prop */}
            <Image src={data.qrCodeDataUrl} style={styles.qrImage} />
            <Text style={styles.qrCaption}>Scan to verify this ticket</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This ticket confirms a fully paid charter with {siteConfig.name}. Verify authenticity at{"\n"}
            {data.verificationUrl}
          </Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}