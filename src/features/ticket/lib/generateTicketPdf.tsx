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
  /**
   * Real city for the departure/destination ICAO code, from the
   * Airport collection (see getTicketAirportCities). Omitted — never
   * invented — when that airport isn't in the database.
   */
  departureAirportName?: string;
  destinationAirportName?: string;
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
  white: "#ffffff",
  slate: "#475569",
  slateLight: "#94a3b8",
  slateFaint: "#cbd5e1",
  hairline: "#e2e8f0",
  champagne: "#c8a95b",
  champagneLight: "#d9c489",
  paidGreen: "#15803d",
  invalidRed: "#b91c1c",
  invalidRedBg: "#fef2f2",
  panel: "#f8fafc",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.navy,
    backgroundColor: COLORS.white,
  },
  // Full-bleed navy header band, matching the web ticket's navy header
  // so the emailed PDF and the on-site ticket read as the same document.
  headerBand: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 40,
    paddingVertical: 26,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 17,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 7.5,
    color: COLORS.champagneLight,
    letterSpacing: 2,
    marginTop: 5,
  },
  ticketLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.champagneLight,
    letterSpacing: 1.5,
    textAlign: "right",
  },
  ticketNumber: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: COLORS.white,
    textAlign: "right",
    marginTop: 6,
  },
  // Status strip, directly under the navy band — mirrors the web ticket's
  // slate strip between the header and the journey.
  statusStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.panel,
    borderBottom: `1 solid ${COLORS.hairline}`,
    paddingHorizontal: 40,
    paddingVertical: 10,
  },
  bookingLabel: {
    fontSize: 8,
    color: COLORS.slateLight,
    letterSpacing: 0.5,
  },
  bookingValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.slate,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 6,
  },
  paidBadge: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1,
    color: COLORS.paidGreen,
  },
  invalidBadge: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1,
    color: COLORS.invalidRed,
  },
  body: {
    paddingHorizontal: 40,
    // Reserves room above the page-bottom-pinned footer (see styles.footer)
    // so a booking with every optional field (FBO address, etc.) still
    // can't visually collide with it.
    paddingBottom: 170,
  },
  journeyLabel: {
    textAlign: "center",
    fontSize: 8,
    color: COLORS.slateLight,
    letterSpacing: 3,
    marginTop: 26,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: 16,
  },
  routeSide: {
    alignItems: "center",
    width: 160,
  },
  routeCode: {
    fontFamily: "Helvetica-Bold",
    fontSize: 34,
  },
  routeCity: {
    fontSize: 9,
    color: COLORS.slate,
    marginTop: 4,
  },
  routeCaption: {
    fontSize: 7,
    color: COLORS.slateLight,
    letterSpacing: 1.5,
    marginTop: 5,
  },
  routeLineWrap: {
    flexDirection: "row",
    alignItems: "center",
    width: 90,
    marginTop: 18,
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.champagneLight,
  },
  // A small rotated square rather than a text glyph — the base-14 PDF
  // fonts only cover WinAnsi/Latin-1, so symbol characters (✦, ✓, ⚠)
  // can silently fail to render. A drawn shape has no such risk.
  routeMark: {
    width: 6,
    height: 6,
    marginHorizontal: 6,
    backgroundColor: COLORS.champagne,
    transform: "rotate(45deg)",
  },
  travelDate: {
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 22,
  },
  travelTime: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.slate,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
    borderTopStyle: "dashed",
    marginTop: 28,
  },
  bodyRow: {
    flexDirection: "row",
    marginTop: 24,
  },
  detailsColumn: {
    flex: 1,
    paddingRight: 24,
  },
  qrColumn: {
    width: 130,
    alignItems: "center",
    borderLeft: `1 solid ${COLORS.hairline}`,
    paddingLeft: 20,
  },
  qrHeading: {
    fontSize: 7,
    color: COLORS.slateLight,
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 8,
  },
  qrImage: {
    width: 110,
    height: 110,
  },
  qrCaption: {
    fontSize: 7,
    color: COLORS.slateLight,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 8,
  },
  qrTicketNumber: {
    fontSize: 7,
    color: COLORS.slateFaint,
    textAlign: "center",
    marginTop: 2,
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
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  // Pinned to the page bottom (not inline) so a short single-page
  // document — the normal case here — still reads as intentionally
  // composed rather than trailing off with a large empty gap.
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: COLORS.panel,
  },
  securityDivider: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  securityDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.hairline,
  },
  securityDividerDots: {
    fontSize: 7,
    color: COLORS.slateFaint,
    letterSpacing: 4,
    marginHorizontal: 8,
  },
  footerBadge: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.champagne,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  footerHeading: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.slate,
    textAlign: "center",
    lineHeight: 1.5,
    marginTop: 6,
  },
  footerContact: {
    fontSize: 7.5,
    color: COLORS.slateLight,
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 10,
  },
});

/**
 * Generates the A4 charter ticket PDF as a Buffer, server-side, from
 * authoritative data the caller has already fetched from the
 * database (never from client-supplied fields) — see
 * app/api/tickets/[ticketId]/pdf/route.ts for the authorization and
 * data-loading side of this. Deliberately only shows information that
 * genuinely exists in the data model — departure time, FBO/terminal,
 * and airport city names render only when the underlying data exists
 * (see BookingTripDetailsActions and getTicketAirportCities), and stay
 * omitted otherwise rather than showing an invented or placeholder
 * value (see Phase 2 requirement #3).
 *
 * `status` defaults to "issued" when the caller doesn't pass it, so the
 * PDF always shows a valid-for-travel badge unless a cancelled or
 * invalidated ticket's status is explicitly threaded through — see the
 * matching non-issued alert on the web ticket page for the same rule
 * applied there.
 *
 * Visual language mirrors components/ticket/TicketCard.tsx (Phase 6 —
 * premium redesign): a full-bleed navy header, a single restrained
 * champagne-gold accent on the route marker and labels, and generous
 * whitespace, so the emailed/printed document and the on-site ticket
 * read as one design system rather than two.
 */
export async function generateTicketPdf(data: TicketPdfData): Promise<Buffer> {
  const status = data.status ?? TICKET_STATUSES.ISSUED;
  const isValid = status === TICKET_STATUSES.ISSUED;

  const doc = (
    <Document title={`${siteConfig.name} — ${data.ticketNumber}`} author={siteConfig.name}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBand}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.companyName}>{siteConfig.name.toUpperCase()}</Text>
              <Text style={styles.tagline}>PRIVATE AVIATION</Text>
            </View>
            <View>
              <Text style={styles.ticketLabel}>PRIVATE CHARTER CONFIRMATION</Text>
              <Text style={styles.ticketNumber}>{data.ticketNumber}</Text>
            </View>
          </View>
        </View>

        {/* Status strip */}
        <View style={styles.statusStrip}>
          <View style={{ ...styles.statusPill, borderColor: isValid ? "#bbf7d0" : "#fecaca" }}>
            <View style={{ ...styles.statusDot, backgroundColor: isValid ? COLORS.paidGreen : COLORS.invalidRed }} />
            <Text style={isValid ? styles.paidBadge : styles.invalidBadge}>
              {isValid ? "PAID IN FULL" : TICKET_STATUS_LABELS[status].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.bookingLabel}>
            BOOKING <Text style={styles.bookingValue}>{data.bookingNumber}</Text>
          </Text>
        </View>

        <View style={styles.body}>
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
                marginTop: 16,
              }}
            >
              <Text style={{ color: COLORS.invalidRed, fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 0.5 }}>
                NOT VALID FOR TRAVEL
              </Text>
            </View>
          ) : null}

          {/* Journey — the visual centerpiece */}
          <Text style={styles.journeyLabel}>JOURNEY</Text>
          <View style={styles.routeRow}>
            <View style={styles.routeSide}>
              <Text style={styles.routeCode}>{data.departureAirportCode}</Text>
              {data.departureAirportName ? <Text style={styles.routeCity}>{data.departureAirportName}</Text> : null}
              <Text style={styles.routeCaption}>DEPARTURE</Text>
            </View>
            <View style={styles.routeLineWrap}>
              <View style={styles.routeLine} />
              <View style={styles.routeMark} />
            </View>
            <View style={styles.routeSide}>
              <Text style={styles.routeCode}>{data.destinationAirportCode}</Text>
              {data.destinationAirportName ? (
                <Text style={styles.routeCity}>{data.destinationAirportName}</Text>
              ) : null}
              <Text style={styles.routeCaption}>DESTINATION</Text>
            </View>
          </View>
          <Text style={styles.travelDate}>
            {formatDate(data.departureDate).toUpperCase()}
            {data.departureTime ? <Text style={styles.travelTime}>  ·  {data.departureTime} local</Text> : null}
          </Text>

          <View style={styles.divider} />

          {/* Details + QR */}
          <View style={styles.bodyRow}>
            <View style={styles.detailsColumn}>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>PASSENGER</Text>
                  <Text style={styles.detailValue}>{data.passengerName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>PASSENGERS</Text>
                  <Text style={styles.detailValue}>
                    {data.passengerCount} {data.passengerCount === 1 ? "passenger" : "passengers"}
                  </Text>
                </View>
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
                {data.fboName ? (
                  <View style={{ ...styles.detailItem, width: "100%" }}>
                    <Text style={styles.detailLabel}>FBO / TERMINAL</Text>
                    <Text style={styles.detailValue}>{data.fboName}</Text>
                    {data.fboAddress ? (
                      <Text style={{ fontSize: 8.5, color: COLORS.slate, marginTop: 3 }}>{data.fboAddress}</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.qrColumn}>
              <Text style={styles.qrHeading}>DIGITAL{"\n"}VERIFICATION</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- this is react-pdf's <Image> (PDF rendering primitive), not an HTML/next <img>; it has no alt prop */}
              <Image src={data.qrCodeDataUrl} style={styles.qrImage} />
              <Text style={styles.qrCaption}>SCAN TO VERIFY</Text>
              <Text style={styles.qrTicketNumber}>{data.ticketNumber}</Text>
            </View>
          </View>
        </View>

        {/* Footer — pinned to the bottom of the page; see styles.footer */}
        <View style={styles.footer}>
          <View style={styles.securityDivider}>
            <View style={styles.securityDividerLine} />
            <Text style={styles.securityDividerDots}>· · · · · · · ·</Text>
            <View style={styles.securityDividerLine} />
          </View>
          <Text style={styles.footerBadge}>VERIFIED DIGITAL CREDENTIAL</Text>
          <Text style={styles.footerHeading}>PRIVATE CHARTER CONFIRMATION</Text>
          <Text style={styles.footerText}>
            This document confirms your private charter reservation with {siteConfig.name}.{"\n"}
            Please retain this confirmation and present it digitally or in printed form when required.{"\n"}
            Verify authenticity at {data.verificationUrl}
          </Text>
          <Text style={styles.footerContact}>
            {siteConfig.name}  ·  {siteConfig.url.replace(/^https?:\/\//, "")}  ·  {siteConfig.email}  ·  {siteConfig.phoneDisplay}
          </Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
