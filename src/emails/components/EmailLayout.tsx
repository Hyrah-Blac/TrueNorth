import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";
import type { ReactNode } from "react";

const colors = {
  navy: "#0e2138",
  sky: "#2f8fdb",
  slate: "#475467",
  slateLight: "#98a2b3",
  border: "#e4e7ec",
  bg: "#f5f7fa",
};

// Static fallback only — used if a caller forgets to pass live contact
// info. Every real send path should supply `contact` from
// getSiteSettings() so the footer reflects whatever's set in
// /admin/settings rather than this hardcoded default.
const DEFAULT_CONTACT: EmailContact = {
  companyName: "True North Charters",
  email: "operations@truenorthcharters.co.ke",
  addressLine1: "Wilson Airport",
  city: "Nairobi",
  country: "Kenya",
};

export interface EmailContact {
  companyName?: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
}

export function EmailLayout({
  previewText,
  heading,
  children,
  contact = DEFAULT_CONTACT,
}: {
  previewText: string;
  heading: string;
  children: ReactNode;
  contact?: EmailContact;
}) {
  const addressParts = [contact.addressLine1, contact.addressLine2, contact.city, contact.country].filter(Boolean);
  const name = contact.companyName ?? "True North Charters";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
          <Section style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: colors.navy,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              {name}
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              padding: "32px 28px",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 700, color: colors.navy, margin: "0 0 16px" }}>
              {heading}
            </Text>
            {children}
          </Section>

          <Section style={{ marginTop: 24 }}>
            <Hr style={{ borderColor: colors.border, margin: "0 0 16px" }} />
            <Text style={{ fontSize: 12, color: colors.slateLight, margin: 0, lineHeight: "18px" }}>
              {name} · {addressParts.join(", ")}
              <br />
              <Link href={`mailto:${contact.email}`} style={{ color: colors.sky }}>
                {contact.email}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailText({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: 14, color: colors.slate, lineHeight: "22px", margin: "0 0 16px" }}>{children}</Text>;
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <Link
        href={href}
        style={{
          backgroundColor: colors.sky,
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

export function EmailDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Section style={{ borderBottom: `1px solid ${colors.border}`, padding: "10px 0" }}>
      <table width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td style={{ fontSize: 13, color: colors.slateLight }}>{label}</td>
            <td style={{ fontSize: 13, color: colors.navy, fontWeight: 600, textAlign: "right" }}>{value}</td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

/**
 * Email-safe rendering of the same "Name [CODE] → Name [CODE]" treatment
 * used everywhere else on the site (see RouteDisplay.tsx) — a serif
 * name with a boxed, monospaced code pill next to it. Built with plain
 * inline styles (no flexbox) since this has to survive Outlook's Word
 * rendering engine, not just modern browsers.
 *
 * Falls back to the bare code when a name isn't available, exactly
 * like RouteDisplay and every other airport display on the site — an
 * airport missing from the database is not an error state.
 */
export function EmailRoute({
  departureCode,
  destinationCode,
  departureName,
  destinationName,
}: {
  departureCode: string;
  destinationCode: string;
  departureName?: string;
  destinationName?: string;
}) {
  const codePill = (code: string) => (
    <span
      style={{
        display: "inline-block",
        border: `1px solid ${colors.border}`,
        borderRadius: 3,
        padding: "1px 4px",
        fontSize: 10,
        fontWeight: 500,
        color: colors.slateLight,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {code}
    </span>
  );

  return (
    <span style={{ fontSize: 13, color: colors.navy, fontWeight: 600 }}>
      {departureName ? `${departureName} ` : ""}
      {codePill(departureCode)}
      <span style={{ color: colors.slateLight, margin: "0 6px" }}>→</span>
      {destinationName ? `${destinationName} ` : ""}
      {codePill(destinationCode)}
    </span>
  );
}

export const emailColors = colors;
