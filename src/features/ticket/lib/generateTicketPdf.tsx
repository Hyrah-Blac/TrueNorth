import "server-only";
import { Document, Page, View, Text, Image, Svg, Path, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
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
   * Real name for the departure/destination airport code, from the
   * Airport collection (see getTicketAirportNames). Omitted — never
   * invented — when that airport isn't in the database.
   */
  departureAirportName?: string;
  destinationAirportName?: string;
  /** Defaults to "issued" if omitted, so existing callers that don't pass it keep getting the PAID IN FULL badge unchanged. */
  status?: TicketStatus;
  /**
   * Contact details shown in the header/footer. All three are
   * optional and fall back to the static defaults in site.ts — but
   * every real caller should pass the admin-configured values from
   * getSiteSettings() (see app/api/tickets/[ticketId]/pdf/route.ts,
   * the ticket page, and sendTicketConfirmationEmail.ts) so a phone
   * number or email changed in admin settings shows up on the ticket
   * without a code deploy.
   */
  companyName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

// Ticket colour palette (Phase 7 — colour refinement pass). Mirrors
// the exact palette in components/ticket/TicketCard.tsx so the
// emailed/downloaded PDF and the on-site ticket read as one document.
// Kept as plain hex here (rather than importing from the web
// component) since react-pdf renders independently of the site's
// Tailwind/CSS custom-property pipeline and can't consume JSX/CSS
// exports. Only built-in Helvetica weights are used (no custom font
// registration/network fetch), which keeps generation fast and works
// reliably in a serverless function.
const COLORS = {
  navy: "#071A2B", // primary deep midnight navy — header band only
  ivory: "#FAF9F6", // the one document field colour
  white: "#ffffff", // reserved for the QR chip — highest contrast for scanning
  ink: "#101828", // primary text, airport codes
  textSecondary: "#667085", // supporting text
  labelMuted: "#8492A6", // small uppercase field labels
  hairline: "#D9DEE5", // all dividers/borders
  gold: "#C6A15B", // champagne gold — verification/micro-label accents
  goldOnNavy: "#D6B978", // soft gold highlight — legible on the navy header
  routeCodeBlue: "#173A66", // Journey airport code colour, mirrors TicketCard's ROUTE_CODE_BLUE
  routeCityBlue: "#5C7FA6", // Journey city caption colour, mirrors TicketCard's ROUTE_CITY_BLUE
  paidGreen: "#176B4D",
  paidBg: "#ECF7F1",
  invalidRed: "#b91c1c",
  invalidRedBg: "#fef2f2",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.ink,
    backgroundColor: COLORS.ivory,
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
    color: COLORS.goldOnNavy,
    letterSpacing: 2,
    marginTop: 5,
  },
  ticketLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.goldOnNavy,
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
  // Status strip — a hairline-bounded band on the same ivory field as
  // the rest of the page, not a separate grey panel; keeps the
  // document to one background colour throughout (mirrors the web
  // ticket's Phase 7 colour refinement).
  statusStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
    paddingHorizontal: 40,
    paddingVertical: 10,
  },
  bookingLabel: {
    fontSize: 8,
    color: COLORS.labelMuted,
    letterSpacing: 0.5,
  },
  bookingValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.textSecondary,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
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
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.gold,
    letterSpacing: 3.5,
    marginTop: 30,
  },
  // flex: 1 on both sides (rather than a fixed width) guarantees they
  // stay exactly equal width regardless of code/city length, so the
  // plane glyph in between is always precisely centered — same
  // reasoning as the grid-cols-[1fr_auto_1fr] layout in TicketCard.tsx.
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  routeSide: {
    flex: 1,
    alignItems: "center",
  },
  routePlane: {
    width: 16,
    height: 16,
    marginHorizontal: 10,
  },
  routeCode: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: COLORS.routeCodeBlue,
    letterSpacing: -0.3,
  },
  routeCity: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.routeCityBlue,
    letterSpacing: 1,
    marginTop: 4,
  },
  travelDate: {
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLORS.ink,
    letterSpacing: 1,
    marginTop: 22,
  },
  travelTime: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.textSecondary,
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
    borderLeftWidth: 1,
    borderLeftColor: COLORS.hairline,
    paddingLeft: 20,
  },
  qrHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    color: COLORS.gold,
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 8,
  },
  // The QR chip stays pure white (not ivory) — highest contrast
  // against the QR's own black modules is what keeps it reliably
  // scannable, on screen and printed.
  qrImageWrap: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: 4,
    padding: 6,
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  qrCaption: {
    fontSize: 7,
    color: COLORS.labelMuted,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 8,
  },
  qrTicketNumber: {
    fontSize: 7,
    color: COLORS.labelMuted,
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
    color: COLORS.labelMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },
  // Pinned to the page bottom (not inline) so a short single-page
  // document — the normal case here — still reads as intentionally
  // composed rather than trailing off with a large empty gap.
  // Pinned to the page bottom (not inline) so a short single-page
  // document — the normal case here — still reads as intentionally
  // composed rather than trailing off with a large empty gap. Uses
  // the same ivory field as the rest of the page (no grey panel) —
  // separation comes from the dotted divider alone.
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: COLORS.ivory,
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
    color: COLORS.hairline,
    letterSpacing: 4,
    marginHorizontal: 8,
  },
  footerBadge: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gold,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  footerHeading: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 1.5,
    marginTop: 6,
  },
  footerContact: {
    fontSize: 7.5,
    color: COLORS.labelMuted,
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
 * and airport names render only when the underlying data exists
 * (see BookingTripDetailsActions and getTicketAirportNames), and stay
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
 * premium redesign; Phase 7 — colour refinement): a single warm-ivory
 * field, a full-bleed deep-midnight-navy header, and champagne gold
 * reserved for route/verification/micro-label accents only — never a
 * background fill — so the emailed/printed document and the on-site
 * ticket read as one design system rather than two.
 */
export async function generateTicketPdf(data: TicketPdfData): Promise<Buffer> {
  const status = data.status ?? TICKET_STATUSES.ISSUED;
  const isValid = status === TICKET_STATUSES.ISSUED;
  // Admin-configured contact details (getSiteSettings()) take
  // priority; site.ts is only the fallback for a caller that somehow
  // didn't pass them — see the TicketPdfData doc comment above.
  const companyName = data.companyName ?? siteConfig.name;
  const contactPhone = data.contactPhone ?? siteConfig.phoneDisplay;
  const contactEmail = data.contactEmail ?? siteConfig.email;

  const doc = (
    <Document title={`${companyName} — ${data.ticketNumber}`} author={companyName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBand}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.companyName}>{companyName.toUpperCase()}</Text>
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
          <View style={{ ...styles.statusPill, backgroundColor: isValid ? COLORS.paidBg : COLORS.invalidRedBg }}>
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

          {/* Journey — mirrors TicketCard.tsx exactly: bold sans code
              in COLORS.routeCodeBlue, city caption in
              COLORS.routeCityBlue, and the same plane glyph (identical
              path + 90° rotation) centered between them, nose pointing
              from departure toward destination. */}
          <Text style={styles.journeyLabel}>JOURNEY</Text>
          <View style={styles.routeRow}>
            <View style={styles.routeSide}>
              <Text style={styles.routeCode}>{data.departureAirportCode}</Text>
              {data.departureAirportName ? <Text style={styles.routeCity}>{data.departureAirportName}</Text> : null}
            </View>
            <Svg viewBox="0 0 24 24" style={styles.routePlane}>
              <Path
                fill={COLORS.routeCityBlue}
                transform="rotate(90, 12, 12)"
                d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2.5 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
              />
            </Svg>
            <View style={styles.routeSide}>
              <Text style={styles.routeCode}>{data.destinationAirportCode}</Text>
              {data.destinationAirportName ? (
                <Text style={styles.routeCity}>{data.destinationAirportName}</Text>
              ) : null}
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
                      <Text style={{ fontSize: 8.5, color: COLORS.textSecondary, marginTop: 3 }}>{data.fboAddress}</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.qrColumn}>
              <Text style={styles.qrHeading}>DIGITAL{"\n"}VERIFICATION</Text>
              <View style={styles.qrImageWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- this is react-pdf's <Image> (PDF rendering primitive), not an HTML/next <img>; it has no alt prop */}
                <Image src={data.qrCodeDataUrl} style={styles.qrImage} />
              </View>
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
            This document confirms your private charter reservation with {companyName}.{"\n"}
            Please retain this confirmation and present it digitally or in printed form when required.{"\n"}
            Verify authenticity at {data.verificationUrl}
          </Text>
          <Text style={styles.footerContact}>
            {companyName}  ·  {siteConfig.url.replace(/^https?:\/\//, "")}  ·  {contactEmail}  ·  {contactPhone}
          </Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}